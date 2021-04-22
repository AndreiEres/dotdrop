import { createContext, useState, useCallback, createElement } from 'react';
import GenerateGift from './GenerateGift';
import PresentGift from './PresentGift';
import ImportAccount from '../../../components/account/ImportAccount';
import ExtensionAccount from '../../../components/account/ExtensionAccount';
import HardwalletAccount from '../../../components/account/HardwalletAccount';
import SignerAccount from '../../../components/account/SignerAccount';
import Processing from '../../../components/Processing';
import ErrorModal from '../../../components/Error';
import { useSubstrate, giftPallet } from '../../../substrate-lib';
import { QRSigner } from '../../../substrate-lib/components';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import ParityQRSigner from '../../../components/ParityQRSigner';
import { web3FromSource } from '@polkadot/extension-dapp';
import SelectAccountSource from './SelectAccountSource';
import SelectAccount from './SelectAccount';

const GenerateContext = createContext();
export { GenerateContext };

export default function GenerateMain() {
  const { apiState, api, keyring } = useSubstrate();
  const { removeGift, createGift } = giftPallet;

  const [step, setStep] = useState(0);
  const [account, setAccount] = useState(null);
  const [accountSource, setAccountSource] = useState(null);
  const [showSigner, setShowSigner] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [processingMsg, setProcessingMsg] = useState('');

  const [
    { isQrHashed, qrAddress, qrPayload, qrResolve },
    setQrState,
  ] = useState({
    isQrHashed: false,
    qrAddress: '',
    qrPayload: new Uint8Array(),
  });

  const [gift, setGift] = useState(null);

  const resetPresentation = () => {
    setProcessing(false);
    setShowSigner(false);
    setProcessingError(null);
    setProcessingMsg('');
  };
  const _setStep = (step) => {
    resetPresentation();
    setStep(step);
  };
  const nextStep = () => {
    _setStep(step + 1);
  };
  const prevStep = () => {
    _setStep(step - 1);
  };
  const jumpToStep = (step) => {
    _setStep(step);
  };

  let qrId = 0;
  const _addQrSignature = useCallback(
    ({ signature }) => {
      qrResolve &&
        qrResolve({
          id: ++qrId,
          signature,
        });
      setShowSigner(false);
      setProcessing(true);
    },
    [qrResolve]
  );

  const handleError = (error) => {
    setProcessing(false);
    setProcessingMsg(null);
    setProcessingError(error.message);
  };

  const createGiftCallback = ({ error, result }) => {
    if (error) {
      handleError(error);
    } else {
      nextStep();
    }
  };

  const removeGiftCallback = ({ error, result }) => {
    if (error) {
      handleError(error);
    } else {
      jumpToStep(2);
    }
  };

  const getSigningAccount = async (account) => {
    let pairOrAddress = account;
    let signer = null;
    if (account?.meta?.isExternal) {
      // it is an external account / needs QRSigner
      pairOrAddress = account.address;
      signer = new QRSigner(api.registry, setQrState);
    } else if (account?.meta?.isInjected) {
      pairOrAddress = account.address;
      const injector = await web3FromSource(account.meta.source);
      signer = injector?.signer;
    }
    return { pairOrAddress, signer };
  };

  const generateGiftHandler = async (giftInfo) => {
    if (apiState !== 'READY') {
      console.log('api not READY!' + apiState);
      window.alert(
        'We were not able to connect to the blockchain!\nPlease Check if you have set the correct rpc address for the chain and in case you are using any adblockers make sure it is turned off!'
      );
    } else if (!account) {
      console.log('no account is selected');
      window.alert(
        'You need to sign in with your account to be able to send a gift 🔑🔓'
      );
    } else {
      // load signing account
      const signingAccount = await getSigningAccount(account);

      // generate mnemonic and interim recipiant account
      const mnemonic = mnemonicGenerate();
      const recipiantName = giftInfo.name;
      const recipiantAccount = keyring.createFromUri(
        mnemonic,
        { name: recipiantName },
        'sr25519'
      );
      const gift = {
        to: recipiantAccount,
        amount: giftInfo.amount,
      };

      createGift(api, signingAccount, gift, createGiftCallback);

      setGift({
        secret: mnemonic,
        name: giftInfo.name || '',
        email: giftInfo.email || '',
        amount: giftInfo.amount,
      });

      // ToDO: make it sync by showing a spinner while the gift is being registered on chain before moving to the next step!
      if (account?.meta?.isExternal) {
        setShowSigner(true);
      } else {
        setProcessingMsg('Generating the gift on the blockchain...');
        setProcessing(true);
      }
    }
  };

  const removeGiftHandler = async (secret) => {
    if (apiState !== 'READY') {
      console.log('api not READY!' + apiState);
      window.alert(
        'We were not able to connect to the blockchain!\nPlease Check if you have set the correct rpc address for the chain and in case you are using any adblockers make sure it is turned off!'
      );
    } else if (!account) {
      console.log('no account is selected');
      window.alert(
        'You need to sign in with your account to be able to send a gift 🔑🔓'
      );
    } else {
      // load signing account
      const signingAccount = await getSigningAccount(account);

      // retrive gift account from secret
      const mnemonic = secret;
      const giftAccount = keyring.createFromUri(
        mnemonic,
        { name: 'interim_gift' },
        'sr25519'
      );

      const gift = {
        to: giftAccount,
      };

      removeGift(api, signingAccount, gift, removeGiftCallback);

      if (account?.meta?.isExternal) {
        setShowSigner(true);
      } else {
        // go to generate gift
        setProcessingMsg('Removing the gift from the blockchain...');
        setProcessing(true);
      }
    }
  };

  const setAccountHandler = (account) => {
    if (account) {
      setAccount(account);
      nextStep();
    } else {
      handleError(
        new Error('No account was selected, please login with your account!')
      );
    }
  };

  const accountOption = {
    IMPORTED_ACCOUNT: ImportAccount,
    EXTENSION_ACCOUNT: ExtensionAccount,
    HARDWALLET_ACCOUNT: HardwalletAccount,
    SIGNER_ACCOUNT: SignerAccount,
  };

  let currentStepComponent;
  switch (step) {
    case 1:
      currentStepComponent = (
        <SelectAccount>
          {createElement(accountOption[accountSource], { setAccountHandler })}
        </SelectAccount>
      );
      break;
    case 2:
      currentStepComponent = (
        <GenerateGift
          account={account}
          generateGiftHandler={generateGiftHandler}
        />
      );
      break;
    case 3:
      currentStepComponent = (
        <PresentGift gift={gift} removeGiftHandler={removeGiftHandler} />
      );
      break;
    default:
      currentStepComponent = <SelectAccountSource />;
  }
  let currentComponent;
  if (showSigner) {
    currentComponent = (
      <ParityQRSigner
        address={qrAddress}
        genesisHash={api.genesisHash}
        isHashed={isQrHashed}
        onSignature={_addQrSignature}
        payload={qrPayload}
      />
    );
  } else {
    currentComponent = currentStepComponent;
  }
  return (
    <GenerateContext.Provider
      value={{
        nextStep,
        prevStep,
        jumpToStep,
        setAccountSource,
      }}>
      {currentComponent}
      <ErrorModal
        show={!!processingError}
        message={processingError}
        handleClose={() => resetPresentation()}
      />
      <Processing
        show={!processingError && processing}
        message={processingMsg}
      />
    </GenerateContext.Provider>
  );
}

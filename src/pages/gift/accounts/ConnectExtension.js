import { useState } from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import Button from '../../../components/CustomButton';
import { useSubstrate, utils } from '../../../substrate-lib';
import AccountSelector from '../../../components/account/AccountSelector';
import CardHeader from '../../../components/CardHeader';

export default function ExtensionAccount({
  setAccountHandler,
  setAddressHandler,
  title,
  prevStepHandler,
}) {
  const { keyring, balances, chainInfo } = useSubstrate();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const accounts = keyring.getPairs();
  const accountsBalances = {};
  balances &&
    accounts?.forEach(({ address }) => {
      if (address && balances[address]) {
        accountsBalances[address] = utils.fromChainUnit(
          balances[address]?.free,
          chainInfo.decimals
        );
      }
    });

  const _setAccountHandler = () => {
    setAccountHandler && setAccountHandler(selectedAccount);
    setAddressHandler && setAddressHandler(selectedAccount.address);
  };
  return (
    <>
      <Card.Body>
        <CardHeader
          title={title || 'Select Your Account'}
          backClickHandler={prevStepHandler}
        />
        <div className="p-3">
          <Row className="p-md-5 justify-content-center">
            <Col
              style={{ height: 200 }}
              className="d-flex flex-column justify-content-center align-items-center text-center">
              <AccountSelector
                accounts={accounts}
                balances={accountsBalances}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
                maxStrlength={15}
              />
            </Col>
          </Row>
          <Row>
            <Col className="pt-4 d-flex justify-content-center">
              <Button onClick={() => _setAccountHandler()}>Connect</Button>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </>
  );
}
import { useState } from 'react';
import { Row, Col, Form } from 'react-bootstrap';
import { useSubstrate } from '../../substrate-lib';
import { mnemonicGenerate } from '@polkadot/util-crypto';
import Button from '../CustomButton';

export default function NewAccount({ setAccountHandler }) {
  const label = 'I have stored my 12 words secret in a safe place.';
  const { keyring } = useSubstrate();
  const createNewAccount = () => {
    const mnemonic = mnemonicGenerate();
    const account = keyring.createFromUri(mnemonic, null, 'sr25519');
    return { mnemonic, account };
  };
  const [newAccount, setNewAccount] = useState(createNewAccount());
  const _setAccountHandler = async () => {
    setAccountHandler(newAccount.account);
  };
  const mnemonicWords = newAccount?.mnemonic
    ? newAccount.mnemonic.split(' ').map((word) => word.trim())
    : [];
  return (
    <>
      <Row className="pt-3 px-3">
        <Col>
          <h3 className="text-center">Your account is Ready!</h3>
          <p>
            Before we deposit your gift to your new account let’s store your
            accont in a secure place be able to access your DOTs in future!
          </p>
        </Col>
      </Row>
      <Row className="p-3 justify-content-center align-items-center">
        <Row className="p-5">
          {mnemonicWords.map((word, index) => (
            <Col md={4}>
              <div className="border-bottom border-dark">{`${word}`}</div>
            </Col>
          ))}
        </Row>
        <div className="w-100" />
        <Col>
          <Form.Check type="checkbox" label={label} />
        </Col>
        <div className="w-100" />
        <Col className="mt-3 d-flex justify-content-end">
          <Button onClick={() => _setAccountHandler()}>Next</Button>
        </Col>
      </Row>
    </>
  );
}

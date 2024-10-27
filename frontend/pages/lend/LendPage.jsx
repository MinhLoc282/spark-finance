import React, { useState, useEffect, useCallback } from 'react';
// import { Principal } from '@dfinity/principal';
import Big from 'big.js';
import DepositPopup from './popups/Deposit/DepositPopup';
import WithdrawPopup from './popups/Withdraw/WithdrawPopup';
import ClaimPopup from './popups/Claim/ClaimPopup';
import styles from './index.module.css';
import BottomLend from './BottomLend';

import { useAuth } from '../../hooks/use-auth-client';

import ckBTC from '../../assets/ckBTC.png';
import ckETH from '../../assets/ckETH.png';
import dckBTC from '../../assets/d.ckBTC.png';
import dckETH from '../../assets/d.cketh.png';
import InfoIcon from '../../components/InfoIcon/InfoIcon';
// import * as deposit0 from '../../../src/declarations/deposit0';
// import * as deposit1 from '../../../src/declarations/deposit1';
// import * as token0 from '../../../src/declarations/token0';
// import * as token1 from '../../../src/declarations/token1';

function LendPage() {
  const {
    deposit0Actor, deposit1Actor, principal, token0Actor, token1Actor,
  } = useAuth();

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [switchPage, setSwitchPage] = useState('ckBTC');
  const [lockedckETH, setLockedckETH] = useState(0);
  const [unlockedckETH, setUnlockedckETH] = useState(0);
  const [depositActor, setDepositActor] = useState(deposit0Actor);
  const [tokenActor, setToken0Actor] = useState(token0Actor);

  const openDepositModal = () => {
    setIsDepositModalOpen(true);
  };

  const closeDepositModal = () => {
    setIsDepositModalOpen(false);
  };

  const openWithdrawModal = () => {
    setIsWithdrawModalOpen(true);
  };

  const closeWithdrawModal = () => {
    setIsWithdrawModalOpen(false);
  };

  const openClaim = () => {
    setIsClaimOpen(true);
  };

  const closeClaim = () => {
    setIsClaimOpen(false);
  };
  const [wrapBalance, setWrapBalance] = useState();
  const [depositedValue, setDepositedValue] = useState();
  const [tokenBalance, setTokenBalance] = useState();
  const [interest, setInterest] = useState();
  const [apy, setAPY] = useState(0);
  const [decimals, setDecimals] = useState();

  const [updateUI, setUpdateUI] = useState(false);

  useEffect(() => {
    setIsDepositModalOpen(false);
    setIsWithdrawModalOpen(false);
    setIsClaimOpen(false);
  }, [switchPage]);

  const getBalanceUI = useCallback(async () => {
    if (principal && depositActor) {
      try {
        const [tokenBalanceRes,
          wrapBalanceRes,
          interestInfoRes,
          apyRes] = await depositActor.getAccountInfo();
        setTokenBalance(tokenBalanceRes);
        setWrapBalance(Number(wrapBalanceRes));
        setInterest(Number(interestInfoRes));
        console.log(interestInfoRes);
        setAPY(apyRes);
      } catch (error) {
        console.log(error);
      }
    }
  }, [principal, depositActor]);

  useEffect(() => {
    getBalanceUI();
  }, [principal, depositActor, updateUI]);

  const fetchCurrentWrap = async (depositType, dActor) => {
    const rt = await dActor.getCurrentMultiplier(depositType);
    return rt;
  };

  const getDeposit = useCallback(async () => {
    if (principal && decimals && depositActor) {
      const tx = await depositActor.getDepositId(principal);
      const originalList = tx[0];

      if (originalList) {
        let totalWrap = BigInt(0);
        let totalUnlocked = BigInt(0);
        let totalDeposited = BigInt(0);

        const idPromises = originalList.map(async (item) => {
          if (item.isActive) {
            const value = await fetchCurrentWrap(item, depositActor);
            const wrapValue = (BigInt(value) * BigInt(10 ** 18)) / BigInt(10 ** decimals);

            const elapsedTime = BigInt(Date.now()) * BigInt(10 ** 6) - BigInt(item.startTime);
            const duration = BigInt(item.duration) * BigInt(24 * 60 * 60 * 1000000000);

            if (elapsedTime < duration) {
              totalWrap += wrapValue;
            } else {
              totalUnlocked += wrapValue;
            }

            const depositedVal = BigInt(item.amount) * BigInt(10 ** 18) / BigInt(10 ** decimals);
            totalDeposited += depositedVal;
          }
        });

        await Promise.all(idPromises);

        setLockedckETH((Number(totalWrap) / 10 ** 18).toFixed(18));
        setUnlockedckETH((Number(totalUnlocked) / 10 ** 18).toFixed(18));
        setDepositedValue((Number(totalDeposited) / 10 ** 18).toFixed(18));
      }
    }
  }, [principal, decimals, depositActor]);

  useEffect(() => {
    getDeposit();
  }, [principal, decimals, depositActor, updateUI]);

  const getDecimal = useCallback(async () => {
    if (depositActor) {
      try {
        const tx = await depositActor.getTokenDecimals();
        setDecimals(Number(tx));
      } catch (error) {
        console.log(error);
      }
    }
  }, [depositActor]);

  useEffect(() => {
    getDecimal();
  }, [depositActor, updateUI]);

  useEffect(() => {
    const fetchData = async () => {
      setDepositActor(switchPage === 'ckETH' ? deposit1Actor : deposit0Actor);
      setToken0Actor(switchPage === 'ckETH' ? token1Actor : token0Actor);

      setLockedckETH(0);
      setUnlockedckETH(0);
      setDepositedValue(0);
      setInterest(0);
      setWrapBalance(0);
      setTokenBalance(BigInt(0));
      setDecimals(undefined);
    };

    fetchData();
  }, [switchPage, deposit0Actor,
    deposit1Actor, token0Actor, token1Actor]);

  return (
    <div>
      <DepositPopup
        isDepositModalOpen={isDepositModalOpen}
        closeDepositModal={closeDepositModal}
        decimals={decimals}
        tokenBalance={tokenBalance}
        setUpdateUI={setUpdateUI}
        depositActor={switchPage === 'ckETH' ? deposit1Actor : deposit0Actor}
        tokenActor={tokenActor}
        btcOrEth={switchPage}
      />
      <WithdrawPopup
        isWithdrawModalOpen={isWithdrawModalOpen}
        closeWithdrawModal={closeWithdrawModal}
        decimals={decimals}
        wrapBalance={wrapBalance}
        setUpdateUI={setUpdateUI}
        depositActor={switchPage === 'ckETH' ? deposit1Actor : deposit0Actor}
        btcOrEth={switchPage}
      />
      <ClaimPopup
        isClaimOpen={isClaimOpen}
        closeClaim={closeClaim}
        decimals={decimals}
        value={(interest / 10 ** decimals).toFixed(6)}
        setUpdateUI={setUpdateUI}
        depositActor={switchPage === 'ckETH' ? deposit1Actor : deposit0Actor}
        btcOrEth={switchPage}
      />
      <div className={styles.Container}>
        <div className={styles.Header}>
          <div>Lend</div>
          <div className={styles.HeaderSwitch}>
            <button
              type="button"
              className={switchPage === 'ckBTC' ? styles.HeaderSwitchItemOn : styles.HeaderSwitchItemOff}
              onClick={() => setSwitchPage('ckBTC')}
            >
              <img width={24} height={24} src={ckBTC} alt="" />
              <div>ckBTC</div>
            </button>
            <button
              type="button"
              className={switchPage === 'ckETH' ? styles.HeaderSwitchItemOn : styles.HeaderSwitchItemOff}
              onClick={() => setSwitchPage('ckETH')}
            >
              <img width={24} height={24} src={ckETH} alt="" />
              <div>ckETH</div>
            </button>
          </div>
        </div>
        <div className={styles.firstTable}>
          <div className={styles.Deposit}>
            <div className={styles.DepositUpper}>
              <div className={styles.TokenDiv}>
                {switchPage === 'ckETH'
                  ? <img width={24} height={24} src={ckETH} alt="" />
                  : <img width={24} height={24} src={ckBTC} alt="" />}
                <div>
                  {' '}
                  {switchPage === 'ckETH' ? 'ckETH' : 'ckBTC'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ lineHeight: '24px', fontSize: '14px' }}>AVAILABLE</div>
                <div style={{ fontSize: '24px', color: 'rgba(204, 204, 204, 1)', marginTop: '6px' }}>
                  {tokenBalance && decimals ? (
                    <div>
                      {Math.round((Number(tokenBalance) / (10 ** decimals)) * 10000) / 10000}
                    </div>
                  )
                    : <div>0</div>}
                </div>
              </div>
            </div>
            <div className={styles.DepositBottom}>
              <div className={styles.TextTitle}>
                <InfoIcon text="DEPOSIT BALANCE" info={`Amount of ${switchPage === 'ckETH' ? 'ckETH' : 'ckBTC'} deposited`} />
              </div>
              {tokenBalance && decimals ? (
                <div className={styles.TextTContent}>
                  {(Math.round((depositedValue) * 1000) / 1000) || 0}
                  {/* {depositedValue} */}
                </div>
              )
                : <div className={styles.TextTContent}>0</div>}
            </div>
            <button type="button" className={styles.ButtonContainer} onClick={openDepositModal}>
              Deposit
              <div className={styles.Ellipse} />
            </button>
          </div>
          <div className={styles.Withdraw}>
            <div className={styles.WithdrawUpper}>
              <div className={styles.TokenDiv}>
                {switchPage === 'ckETH'
                  ? <img width={24} height={24} src={dckETH} alt="" />
                  : <img width={24} height={24} src={dckBTC} alt="" />}
                <div>
                  {' '}
                  {switchPage === 'ckETH' ? 'd.ckETH' : 'd.ckBTC'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ lineHeight: '24px', fontSize: '14px' }}>
                  <InfoIcon
                    text="AVAILABLE"
                    info={`Amount of ${switchPage === 'ckETH' ? 'd.ckETH' : 'd.ckBTC'} withdrawable to ${switchPage === 'ckETH' ? 'ckETH' : 'ckBTC'}`}
                  />
                </div>
                <div style={{ fontSize: '24px', color: 'rgba(204, 204, 204, 1)', marginTop: '6px' }}>
                  {parseFloat(
                    new Big(wrapBalance || 0)
                      .div(new Big(10).pow(decimals || 0))
                      .plus(new Big(unlockedckETH))
                      .toFixed(2),
                  ) || 0}
                </div>
              </div>
            </div>
            <div className={styles.WithdrawBottom}>
              <div className={styles.TextTitle}>
                <InfoIcon
                  text="LOCKED"
                  info={`Multiplier of ${switchPage === 'ckETH' ? 'd.ckETH' : 'd.ckBTC'} locked in vault to earn interest`}
                />
              </div>
              <div className={styles.TextTContent}>
                {parseFloat(lockedckETH).toFixed(6)}
                {' '}
                {' '}
                {switchPage === 'ckETH' ? 'd.ckETH' : 'd.ckBTC'}
              </div>
            </div>
            <button type="button" className={styles.ButtonContainer} onClick={openWithdrawModal}>
              Withdraw
              <div className={styles.Ellipse} />
            </button>
          </div>
          <div className={styles.Claim}>
            <div className={styles.ClaimUpper}>
              <div className={styles.TokenDiv}>
                {switchPage === 'ckETH'
                  ? <img width={24} height={24} src={ckETH} alt="" />
                  : <img width={24} height={24} src={ckBTC} alt="" />}
                <div>
                  {' '}
                  {switchPage === 'ckETH' ? 'ckETH' : 'ckBTC'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {interest ? <div style={{ fontSize: '24px', color: 'rgba(204, 204, 204, 1)', marginTop: '6px' }}>{(interest / 10 ** decimals).toFixed(6)}</div>
                  : <div style={{ fontSize: '24px', color: 'rgba(204, 204, 204, 1)', marginTop: '6px' }}>0</div>}
              </div>
            </div>
            <div className={styles.ClaimBottom}>
              <div className={styles.TextTitle}>INTEREST APY (24HRS)</div>
              <div className={styles.TextTContent}>
                <div className={styles.TextTContent}>
                  {Number(lockedckETH) === 0
                    ? '0%'
                    : `${(apy).toFixed(4)}%`}
                </div>
              </div>
            </div>
            <button type="button" className={styles.ButtonContainer} onClick={openClaim}>
              Claim
              <div className={styles.Ellipse} />
            </button>
          </div>
        </div>
        <BottomLend
          switchPage={switchPage}
          depositActor={switchPage === 'ckETH' ? deposit1Actor : deposit0Actor}
          updateUI={updateUI}
          lockedckETH={lockedckETH}
          unlockedckETH={unlockedckETH}
        />
      </div>
    </div>
  );
}

export default LendPage;

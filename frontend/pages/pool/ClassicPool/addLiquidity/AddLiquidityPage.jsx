import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useFormik } from 'formik';
import * as Yup from 'yup';

import { Principal } from '@dfinity/principal';

import Big from 'big.js';
import { useAuth } from '../../../../hooks/use-auth-client';

import SelectTokenModal from './SelectTokenModal/SelectTokenModal';

import {
  calculateAmount0Desired, calculateAmount1Desired, getPriceFromPair, getActor,
} from '../../../../utils';

import styles from './index.module.css';
import AddLiquidityModal from './AddLiquidityModal/AddLiquidityModal';

import ckBTC from '../../../../assets/ckBTC.png';
import ckETH from '../../../../assets/ckETH.png';
import dckBTC from '../../../../assets/d.ckBTC.png';
import dckETH from '../../../../assets/d.cketh.png';

import * as token0 from '../../../../../src/declarations/token0';
import * as token1 from '../../../../../src/declarations/token1';
import * as deposit0 from '../../../../../src/declarations/deposit0';
import * as deposit1 from '../../../../../src/declarations/deposit1';
import PriceRangeChart from '../../../../components/priceChart/PriceChart';

const pairMapping = {
  'eth-btc': {
    token0Label: 'ckETH',
    token1Label: 'ckBTC',
    token0Image: ckETH,
    token1Image: ckBTC,
    token0Name: 'Ethereum',
    token1Name: 'Bitcoin',
    token0CanisterId: token1.canisterId,
    token1CanisterId: token0.canisterId,
  },
  'eth-deth': {
    token0Label: 'ckETH',
    token1Label: 'd.ckETH',
    token0Image: ckETH,
    token1Image: dckETH,
    token0Name: 'Ethereum',
    token1Name: 'd.ckETH',
    token0CanisterId: token1.canisterId,
    token1CanisterId: deposit1.canisterId,
  },
  'btc-dbtc': {
    token0Label: 'd.ckBTC',
    token1Label: 'ckBTC',
    token0Image: ckETH,
    token1Image: dckBTC,
    token0Name: 'd.ckBTC',
    token1Name: 'Bitcoin',
    token0CanisterId: token0.canisterId,
    token1CanisterId: deposit0.canisterId,
  },
};

function AddLiquidityPage() {
  const {
    swapActor, principal, identity, getMappingFromPair,
  } = useAuth();
  const { pair } = useParams();
  const navigation = useNavigate();

  const [currentPairMapping, setCurrentPairMapping] = useState(pairMapping);

  const {
    token0Label, token1Label, token0Image, token1Image, token0Name, token1Name,
    token0CanisterId, token1CanisterId,
  } = currentPairMapping[pair];

  const validation = useFormik({
    initialValues: {
      token0: token0CanisterId,
      token1: token1CanisterId,
      amount0Desired: 0,
      amount1Desired: 0,
    },

    validationSchema: Yup.object().shape({
      token0: Yup.string().required('Token0 is required'),
      token1: Yup.string().required('Token1 is required'),
      amount0Desired: Yup.string().required('Amount0 Desired is required'),
      amount1Desired: Yup.string().required('Amount1 Desired is required'),
    }),

    onSubmit: async (values) => {
      setFormValues(values);

      openAddLiquidityModal();
    },
  });

  const [userBalances, setUserBalances] = useState([]);
  const [price, setPrice] = useState();
  const [priceMin, setPriceMin] = useState();
  const [priceMax, setPriceMax] = useState();
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isAddLiquidityModalOpen, setIsAddLiquidityModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(validation.values);
  const [amount1Desired, setAmount1Desired] = useState(validation.values.amount1Desired);
  const [amount0Desired, setAmount0Desired] = useState(validation.values.amount0Desired);
  const [isPriceRangeToken0PerToken1, setIsPriceRangeToken0PerToken1] = useState(true);
  const [displayedPrice, setDisplayedPrice] = useState(price);

  const openTokenModal = () => {
    // setIsTokenModalOpen(true);
  };

  const closeTokenModal = () => {
    setIsTokenModalOpen(false);
  };

  const openAddLiquidityModal = () => {
    setIsAddLiquidityModalOpen(true);
  };

  const closeAddLiquidityModal = () => {
    setIsAddLiquidityModalOpen(false);
  };

  const handleGoBack = () => {
    navigation('/pool');
  };

  const handleClearForm = () => {
    validation.resetForm();
    setPriceMin('');
    setPriceMax('');
  };

  const handleSelectFullRange = () => {
    setPriceMin(0);
    setPriceMax(Infinity);
  };

  const setMaxInput = (inputField) => {
    if (inputField === 'amount0Desired') {
      const token0Balance = new Big(userBalances[0].toString()).div(new Big(10).pow(18));
      validation.setFieldValue('amount0Desired', token0Balance.toString());
      setAmount0Desired(token0Balance);
    } else if (inputField === 'amount1Desired') {
      const token1Balance = new Big(userBalances[1].toString()).div(new Big(10).pow(18));
      validation.setFieldValue('amount1Desired', token1Balance.toString());
      setAmount1Desired(token1Balance);
    }
  };

  const handleGetUserBalances = async () => {
    const token0ActorForSelectedToken = getActor(validation.values.token0, identity);

    const token1ActorForSelectedToken = getActor(validation.values.token1, identity);

    const token0Balance = await token0ActorForSelectedToken.icrc1_balance_of({
      owner: principal,
      subaccount: [],
    });
    const token1Balance = await token1ActorForSelectedToken.icrc1_balance_of({
      owner: principal,
      subaccount: [],
    });

    setUserBalances([token0Balance, token1Balance]);
  };

  const updatePriceRange = (currentPrice, isToken0PerToken1) => {
    if (isToken0PerToken1) {
      setPriceMin(currentPrice - currentPrice / 2);
      setPriceMax(currentPrice * 2);
    } else {
      const invertedPrice = 1 / currentPrice;
      setPriceMin(invertedPrice - invertedPrice / 2);
      setPriceMax(invertedPrice * 2);
    }
  };

  useEffect(() => {
    async function fetchMapping() {
      const mapping = await getMappingFromPair(pairMapping);
      setCurrentPairMapping(mapping);
    }

    fetchMapping();
  }, []);

  useEffect(() => {
    if (validation.values.token0 !== token0CanisterId) {
      validation.setFieldValue('token0', token0CanisterId);
    }
    if (validation.values.token1 !== token1CanisterId) {
      validation.setFieldValue('token1', token1CanisterId);
    }
  }, [token0CanisterId, token1CanisterId]);

  useEffect(() => {
    if (
      !Number.isNaN(Number(validation.values.amount0Desired))
    && !Number.isNaN(Number(price))
    && !Number.isNaN(Number(priceMin))
    && !Number.isNaN(Number(priceMax))
    ) {
      const newAmount1Desired = calculateAmount1Desired(
        validation.values.amount0Desired || Big(0),
        price,
        priceMin,
        priceMax,
      );
      if (!newAmount1Desired.eq(amount1Desired)) {
        setAmount1Desired(newAmount1Desired);
        validation.setFieldValue('amount1Desired', newAmount1Desired.toString());
      }
    }
  }, [validation.values.amount0Desired, price, priceMin, priceMax]);

  useEffect(() => {
    if (
      !Number.isNaN(Number(validation.values.amount1Desired))
    && !Number.isNaN(Number(price))
    && !Number.isNaN(Number(priceMin))
    && !Number.isNaN(Number(priceMax))
    ) {
      const newAmount0Desired = calculateAmount0Desired(
        validation.values.amount1Desired || Big(0),
        price,
        priceMin,
        priceMax,
      );
      if (!newAmount0Desired.eq(amount0Desired)) {
        setAmount0Desired(newAmount0Desired);
        validation.setFieldValue('amount0Desired', newAmount0Desired.toString());
      }
    }
  }, [validation.values.amount1Desired, price, priceMin, priceMax]);

  useEffect(() => {
    const handleGetPriceFromPair = async () => {
      if (validation.values.token0 && validation.values.token1
        && (validation.values.token0 !== validation.values.token1)) {
        const res = await getPriceFromPair(
          swapActor,
          Principal.fromText(validation.values.token0),
          Principal.fromText(validation.values.token1),
        );

        setPrice(res);
      } else {
        setPrice(null);
      }
    };

    if (swapActor) {
      handleGetPriceFromPair();
    }
  }, [validation.values.token0, validation.values.token1]);

  useEffect(() => {
    setPriceMin(price - price / 2);
    setPriceMax(price * 2);
  }, [price]);

  useEffect(() => {
    if (swapActor && principal && validation.values.token0
      && validation.values.token1) {
      handleGetUserBalances();
    }
  }, [swapActor, principal, validation.values.token0, validation.values.token1]);

  useEffect(() => {
    setDisplayedPrice(isPriceRangeToken0PerToken1 ? price : 1 / price);
  }, [price, isPriceRangeToken0PerToken1]);

  useEffect(() => {
    if (price !== undefined && !Number.isNaN(price)) {
      updatePriceRange(price, isPriceRangeToken0PerToken1);
    }
  }, [price, isPriceRangeToken0PerToken1]);

  return (
    <div className={styles.PageContainer}>

      <div className={styles.CardContainer}>
        <div className={styles.TitleContainer}>
          <button type="button" onClick={() => handleGoBack()}>&lt;</button>
          <h1>Add Liquidity</h1>
          <button type="button" onClick={() => handleClearForm()}>Clear All</button>
        </div>

        <form onSubmit={validation.handleSubmit}>
          <div className={styles.LeftContainer}>
            {/* <div className={styles.PairSelection}>
              <h2>Select Pair</h2>
              <div className={styles.TokenContainer}>
                <button type="button" onClick={() => openTokenModal('0')} className={styles.Button}>
                  {token0Label || 'Select Token 0'}
                </button>

                <button type="button" onClick={() => openTokenModal('1')} className={styles.Button}>
                  {token1Label || 'Select Token 1'}
                </button>
              </div>
            </div> */}

            <div className={styles.DepositAmounts}>
              <h2>Deposit Amounts</h2>

              <div>
                <div className={styles.LabelContainer}>
                  <div className={styles.Label}>
                    <div className={styles.TokenDiv}>
                      <img width={24} height={24} src={token0Image} alt="" />
                      <div>
                        {' '}
                        {token0Label}
                      </div>
                    </div>
                    <div>
                      Balance:
                      {' '}
                      {userBalances[0]
                        ? Math.round((Number(userBalances[0]) / 10 ** 18) * 1000) / 1000 : 0}
                    </div>
                  </div>
                </div>

                <div className={styles.InputContainer}>
                  <div className={styles.InputGroup}>
                    <div className={styles.IconContainer}>
                      <span className={styles.Icon}>
                        <img width={18} height={18} src={token0Image} alt="" />
                      </span>
                    </div>
                    <input
                      type="number"
                      className={styles.InputFieldDeposit}
                      placeholder="0.0"
                      id="amount0Desired"
                      name="amount0Desired"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={Big(validation.values.amount0Desired || 0)
                        .round(9, Big.roundDown) || 0}
                    />
                    <button type="button" className={styles.MaxButton} onClick={() => setMaxInput('amount0Desired')}>
                      Max
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className={styles.LabelContainer}>
                  <div className={styles.Label}>
                    <div className={styles.TokenDiv}>
                      <img width={24} height={24} src={token1Image} alt="" />
                      <div>
                        {' '}
                        {token1Label}
                      </div>
                    </div>
                    <div>
                      Balance:
                      {' '}
                      {userBalances[0]
                        ? Math.round((Number(userBalances[1]) / 10 ** 18) * 1000) / 1000 : 0}
                    </div>
                  </div>
                </div>

                <div className={styles.InputContainer}>
                  <div className={styles.InputGroup}>
                    <div className={styles.IconContainer}>
                      <span className={styles.Icon}>
                        <img width={18} height={18} src={token1Image} alt="" />
                      </span>
                    </div>
                    <input
                      type="number"
                      className={styles.InputFieldDeposit}
                      placeholder="0.0"
                      id="amount1Desired"
                      name="amount1Desired"
                      onChange={validation.handleChange}
                      onBlur={validation.handleBlur}
                      value={Big(validation.values.amount1Desired || 0)
                        .round(9, Big.roundDown) || 0}
                    />
                    <button type="button" className={styles.MaxButton} onClick={() => setMaxInput('amount1Desired')}>
                      Max
                    </button>
                  </div>
                </div>
              </div>

              {/* <div>
                <label htmlFor="amount0Desired">
                  {token0Label}
                </label>

                <input
                  type="number"
                  id="amount0Desired"
                  name="amount0Desired"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.amount0Desired || 0}
                />
                {validation.touched.amount0Desired && validation.errors.amount0Desired && (
                <div>{validation.errors.amount0Desired}</div>
                )}
                <p>
                  Balance:
                  {' '}
                  {userBalances[0]
                    ? Math.round((Number(userBalances[0]) / 10 ** 18) * 1000) / 1000 : 0}
                </p>
              </div> */}

              {/* <div>
                <label htmlFor="amount1Desired">
                  {token1Label}
                </label>

                <input
                  type="number"
                  id="amount1Desired"
                  name="amount1Desired"
                  onChange={validation.handleChange}
                  onBlur={validation.handleBlur}
                  value={validation.values.amount1Desired || 0}
                />
                {validation.touched.amount1Desired && validation.errors.amount1Desired && (
                <div>{validation.errors.amount1Desired}</div>
                )}
                <p>
                  Balance:
                  {' '}
                  {userBalances[1]
                    ? Math.round((Number(userBalances[1]) / 10 ** 18) * 1000) / 1000 : 0}
                </p>
              </div> */}
            </div>
          </div>

          <div className={styles.RightContainer}>
            <div className={styles.PriceRange}>
              <h2>Set Price Range</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <p>
                  Current Price:
                  {' '}
                  {(displayedPrice || 0).toFixed(6)}
                  {' '}
                  <span style={{ marginLeft: '5px' }}>
                    {isPriceRangeToken0PerToken1
                      ? `${token1Label || '--'} per ${token0Label}`
                      : `${token0Label} per ${token1Label}`}
                  </span>
                </p>

                <div style={{ display: 'flex' }}>
                  <button type="button" className={styles.Button} onClick={() => handleSelectFullRange()}>Full Range</button>
                  <div className={styles.PriceRangeToggle}>
                    <button
                      type="button"
                      className={isPriceRangeToken0PerToken1 ? styles.Active : ''}
                      onClick={() => setIsPriceRangeToken0PerToken1(true)}
                    >
                      {token0Label}
                    </button>
                    <button
                      type="button"
                      className={!isPriceRangeToken0PerToken1 ? styles.Active : ''}
                      onClick={() => setIsPriceRangeToken0PerToken1(false)}
                    >
                      {token1Label}
                    </button>
                  </div>
                </div>
              </div>
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={(priceMin || 0).toFixed(6)}
                onChange={(e) => setPriceMin(parseFloat(e.target.value))}
              />

              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={(priceMax || 0).toFixed(6)}
                onChange={(e) => setPriceMax(parseFloat(e.target.value))}
              />
            </div>

            {/* <PriceRangeChart
              price={price}
              token0Label={token0Label}
              token1Label={token1Label}
            /> */}

            <button type="submit" className={styles.Button}>Submit</button>
          </div>
        </form>
      </div>

      <SelectTokenModal
        isTokenModalOpen={isTokenModalOpen}
        closeTokenModal={closeTokenModal}
        token0Label={token0Label}
        token1Label={token1Label}
        token0Image={token0Image}
        token1Image={token1Image}
        token0Name={token0Name}
        token1Name={token1Name}
      />

      <AddLiquidityModal
        isAddLiquidityModalOpen={isAddLiquidityModalOpen}
        closeAddLiquidityModal={closeAddLiquidityModal}
        formValues={formValues}
        validation={validation}
        setAmount0Desired={setAmount0Desired}
        setAmount1Desired={setAmount1Desired}
        price={price}
        priceMin={priceMin}
        priceMax={priceMax}
        handleGetUserBalances={handleGetUserBalances}
      />
    </div>
  );
}

export default AddLiquidityPage;

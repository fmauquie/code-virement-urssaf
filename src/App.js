import React, { useCallback, useState } from 'react';
import { Field, Form as FinalForm } from 'react-final-form';

function calculateNextMonthPeriod() {
  const nextMonth = new Date().getMonth() + 1;
  const isNextYear = nextMonth === 12;
  const trimester = isNextYear ? 1 : Math.floor(nextMonth / 3) + 1;
  const month = isNextYear ? 1 : nextMonth % 3 + 1;
  return {
    periodCode: '' + (trimester * 10 + month),
    isNextYear,
  };
}

function calculateNextTrimesterPeriod() {
  const nextTrimesterMonth = new Date().getMonth() + 2;
  const isNextYear = nextTrimesterMonth > 12;
  const trimester = isNextYear ? 1 : Math.floor(nextTrimesterMonth / 3) + 1;
  return {
    periodCode: '' + trimester + '0',
    isNextYear,
  };
}

const calculatePeriod = {
  month: calculateNextMonthPeriod,
  trimester: calculateNextTrimesterPeriod,
  regularization: () => ({ periodCode: 62, isNextYear: false })
}

function calculateInitialCodeParts(periodType) {
  const urssafCode = localStorage.getItem('urssafCode') || '99S1';
  const { periodCode, isNextYear } = calculatePeriod[periodType]();
  const year = new Date().getFullYear() + (isNextYear ? 1 : 0);
  const siret = localStorage.getItem('siret') || '';

  return {
    urssafCode,
    periodCode,
    year,
    siret,
  };
}

function App() {
  const [page, setPage] = useState('periodType');
  const [codeParts, setCodeParts] = useState({});
  const [code, setCode] = useState(null);
  const [periodType, setPeriodType] = useState('trimester');

  const validate = useCallback(({ urssafCode, year, siret }) => {
    const errors = [];
    if (urssafCode.length !== 4) {
      errors.push(['urssafCode', `Le code URSSAF est foireux (doit être 4 caractères)`])
    }
    if (!/^2\d{3}$/.test(year)) {
      errors.push(['year', `L'année est foireuse`])
    }
    if (siret.length !== 14) {
      errors.push(['siret', `Le code SIRET doit faire 14 caractères, il en fait ${siret.length}.`])
    }

    return errors.length ? errors.reduce((errs, [key, val]) => ({ ...errs, [key]: val }), {}) : undefined;
  }, []);

  const decidePeriodType = useCallback((newPeriodType) => {
    setPage('codeParts');
    setPeriodType(newPeriodType);
    setCodeParts(calculateInitialCodeParts(newPeriodType));
  }, []);

  const calculateCode = useCallback((values) => {
    const code = `${values.urssafCode}${values.year}${values.periodCode}${values.siret}`;
    if (code.length !== 24) {
      return { length: `Le code devrait faire 24 caractères, il en fait ${code.length}.` };
    }
    localStorage.setItem('urssafCode', values.urssafCode);
    localStorage.setItem('siret', values.siret);

    setCodeParts(values);
    setPage('code');
    setCode(code);
  }, []);

  if (page === 'periodType') {
    return (
      <div className="App">
        <h1>Type de périodicité</h1>
        <button onClick={() => decidePeriodType('trimester')}>Trimestrielle</button>
        <button onClick={() => decidePeriodType('month')}>Mensuelle</button>
        <button onClick={() => decidePeriodType('regularization')}>Régularisation annuelle</button>
      </div>
    );
  }

  if (page === 'code') {
    return (
      <div className="App">
        <h1>
          <button onClick={() => setPage('codeParts')}>&lt;</button>
          Code
        </h1>
        <p>{code}</p>
      </div>
    );
  }

  return (
    <div className="App">
      <h1>
        <button onClick={() => setPage('periodType')}>&lt;</button>
        Périodicité:
        {periodType === 'trimester' && <span> trimestrielle</span>}
        {periodType === 'month' && <span> mensuelle</span>}
        {periodType === 'regularization' && <span> régularisation annuelle</span>}
      </h1>
      <FinalForm
        initialValues={codeParts}
        validate={validate}
        onSubmit={calculateCode}
        render={({ handleSubmit }) => (
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor='urssafCode'>Code organisme URSSAF</label>
              <Field
                name='urssafCode'
                component='input'
              />
            </div>
            <div>
              <label htmlFor='year'>Année</label>
              <Field
                name='year'
                component='input'
                type='number'
              />
            </div>
            <div>
              <label htmlFor='periodCode'>Période</label>
              {periodType === 'trimester' && (
                <Field
                  name='periodCode'
                  component='select'
                >
                  <option value='10'>T1</option>
                  <option value='20'>T2</option>
                  <option value='30'>T3</option>
                  <option value='40'>T4</option>
                </Field>
              )}
              {periodType === 'month' && (
                <Field
                  name='periodCode'
                  component='select'
                >
                  <option value={11}>01 - Janvier</option>
                  <option value={12}>02 - Février</option>
                  <option value={13}>03 - Mars</option>
                  <option value={21}>04 - Avril</option>
                  <option value={22}>05 - Mai</option>
                  <option value={23}>06 - Juin</option>
                  <option value={31}>07 - Juillet</option>
                  <option value={32}>08 - Août</option>
                  <option value={33}>09 - Septembre</option>
                  <option value={41}>10 - Octobre</option>
                  <option value={42}>11 - Novembre</option>
                  <option value={43}>12 - Décembre</option>
                </Field>
              )}
              {periodType === 'regularization' && <span>Régularisation annuelle</span>}
            </div>
            <div>
              <label htmlFor='siret'>SIRET</label>
              <Field
                name='siret'
                component='input'
              />
              <p>
                SIRET est soit le siret,
                soit le numéro de compte URSSAF sans les 0 après le 117 et avec la clé à la fin
                (e.g. le numéro de compte tel que donné dans le cadre "RÉFÉRENCES" des appels de cotisation)
              </p>
            </div>
            <div>
              <button type='submit'>Calculer</button>
            </div>
          </form>
        )}
      />
    </div>
  );
}

export default App;

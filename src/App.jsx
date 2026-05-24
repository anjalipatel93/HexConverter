import { useState } from 'react'
import './App.css'

const emptyRadixResults = { hex: '', decimal: '', binary: '', octal: '' }
const emptyVoltageResults = { peak: '', peakToPeak: '' }

function formatVoltage(value) {
  const numericValue = Number(value)

  if (Number.isNaN(numericValue)) {
    return value
  }

  return numericValue.toFixed(4).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

function getWaveformPath(type, width, height) {
  const centerY = height / 2
  const amplitude = height * 0.33
  const left = 24
  const right = width - 24
  const usableWidth = right - left

  if (type === 'square') {
    const topY = centerY - amplitude
    const bottomY = centerY + amplitude
    const segment = usableWidth / 6

    return [
      `M ${left} ${bottomY}`,
      `L ${left} ${topY}`,
      `L ${left + segment} ${topY}`,
      `L ${left + segment} ${bottomY}`,
      `L ${left + segment * 2} ${bottomY}`,
      `L ${left + segment * 2} ${topY}`,
      `L ${left + segment * 3} ${topY}`,
      `L ${left + segment * 3} ${bottomY}`,
      `L ${left + segment * 4} ${bottomY}`,
      `L ${left + segment * 4} ${topY}`,
      `L ${left + segment * 5} ${topY}`,
      `L ${left + segment * 5} ${bottomY}`,
      `L ${right} ${bottomY}`,
    ].join(' ')
  }

  if (type === 'triangle') {
    const topY = centerY - amplitude
    const bottomY = centerY + amplitude
    const quarter = usableWidth / 4

    return [
      `M ${left} ${centerY}`,
      `L ${left + quarter} ${topY}`,
      `L ${left + quarter * 2} ${bottomY}`,
      `L ${left + quarter * 3} ${topY}`,
      `L ${right} ${centerY}`,
    ].join(' ')
  }

  const points = []
  const totalPoints = 120

  for (let index = 0; index <= totalPoints; index += 1) {
    const ratio = index / totalPoints
    const x = left + ratio * usableWidth
    const y = centerY - amplitude * Math.sin(ratio * Math.PI * 4)
    points.push(`${index === 0 ? 'M' : 'L'} ${x} ${y}`)
  }

  return points.join(' ')
}

function WaveformPreview({ waveform, vrms, peak, peakToPeak }) {
  const width = 420
  const height = 220
  const centerY = height / 2
  const amplitude = height * 0.33
  const topY = centerY - amplitude
  const bottomY = centerY + amplitude
  const path = getWaveformPath(waveform, width, height)

  return (
    <div className="results card waveform-card">
      <h2>Waveform Preview</h2>
      <svg viewBox={`0 0 ${width} ${height}`} className="waveform-svg" role="img" aria-label={`${waveform} wave voltage graph`}>
        <line x1="24" y1={centerY} x2={width - 24} y2={centerY} className="wave-axis" />
        <line x1="24" y1={topY} x2={width - 24} y2={topY} className="wave-guide" />
        <line x1="24" y1={bottomY} x2={width - 24} y2={bottomY} className="wave-guide" />
        <line x1="40" y1={topY} x2="40" y2={bottomY} className="wave-measure" />
        <path d={path} className="wave-path" />
        <text x="48" y={topY - 8} className="wave-label">+Vpeak {formatVoltage(peak)} V</text>
        <text x="48" y={bottomY + 20} className="wave-label">-Vpeak {formatVoltage(peak)} V</text>
        <text x="48" y={centerY - 8} className="wave-label">0 V</text>
        <text x="48" y={centerY + 18} className="wave-label">Vpp {formatVoltage(peakToPeak)} V</text>
      </svg>
      <p className="helper-text">Waveform: {waveform.charAt(0).toUpperCase() + waveform.slice(1)} · Vrms {formatVoltage(vrms)} V</p>
    </div>
  )
}

function App() {
  const [activeTab, setActiveTab] = useState('radix')
  const [input, setInput] = useState('')
  const [inputFormat, setInputFormat] = useState('hex')
  const [results, setResults] = useState(emptyRadixResults)
  const [error, setError] = useState('')
  const [vrmsInput, setVrmsInput] = useState('')
  const [waveform, setWaveform] = useState('sine')
  const [voltageResults, setVoltageResults] = useState(emptyVoltageResults)
  const [voltageError, setVoltageError] = useState('')

  const isValidHex = (value) => /^[0-9a-fA-F]+$/.test(value)
  const isValidDecimal = (value) => /^[0-9]+$/.test(value)
  const isValidBinary = (value) => /^[01]+$/.test(value)
  const isValidOctal = (value) => /^[0-7]+$/.test(value)

  const resetRadixState = () => {
    setInput('')
    setInputFormat('hex')
    setResults(emptyRadixResults)
    setError('')
  }

  const resetVoltageState = () => {
    setVrmsInput('')
    setWaveform('sine')
    setVoltageResults(emptyVoltageResults)
    setVoltageError('')
  }

  const handleConvert = () => {
    const trimmed = input.trim().replace(/^0x/i, '')
    if (!trimmed) {
      setError('Please enter a value.')
      setResults(emptyRadixResults)
      return
    }

    let decimalValue
    try {
      switch (inputFormat) {
        case 'hex':
          if (!isValidHex(trimmed)) throw new Error('Invalid hex value. Use 0-9, A-F.')
          decimalValue = parseInt(trimmed, 16)
          break
        case 'decimal':
          if (!isValidDecimal(trimmed)) throw new Error('Invalid decimal value. Use 0-9.')
          decimalValue = parseInt(trimmed, 10)
          break
        case 'binary':
          if (!isValidBinary(trimmed)) throw new Error('Invalid binary value. Use 0-1.')
          decimalValue = parseInt(trimmed, 2)
          break
        case 'octal':
          if (!isValidOctal(trimmed)) throw new Error('Invalid octal value. Use 0-7.')
          decimalValue = parseInt(trimmed, 8)
          break
        default:
          throw new Error('Unknown format')
      }

      if (decimalValue < 0) throw new Error('Value must be non-negative.')

      setError('')
      setResults({
        hex: decimalValue.toString(16).toUpperCase(),
        decimal: decimalValue.toString(10),
        binary: decimalValue.toString(2),
        octal: decimalValue.toString(8),
      })
    } catch (err) {
      setError(err.message)
      setResults(emptyRadixResults)
    }
  }

  const handleVoltageConvert = () => {
    const trimmed = vrmsInput.trim()

    if (!trimmed) {
      setVoltageError('Please enter a Vrms value.')
      setVoltageResults(emptyVoltageResults)
      return
    }

    const numericValue = Number(trimmed)

    if (Number.isNaN(numericValue)) {
      setVoltageError('Invalid voltage value. Use digits and a decimal point if needed.')
      setVoltageResults(emptyVoltageResults)
      return
    }

    if (numericValue < 0) {
      setVoltageError('Voltage must be non-negative.')
      setVoltageResults(emptyVoltageResults)
      return
    }

    const peak = numericValue * Math.sqrt(2)
    const peakToPeak = peak * 2

    setVoltageError('')
    setVoltageResults({
      peak: peak.toFixed(4),
      peakToPeak: peakToPeak.toFixed(4),
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (activeTab === 'radix') {
        handleConvert()
        return
      }

      handleVoltageConvert()
    }
  }

  return (
    <div className="container">
      <h1>🔢 Radix Converter</h1>
      <p className="subtitle">Switch between radix conversion and an electrical voltage helper</p>

      <div className="tab-row card">
        <button
          className={`tab-button ${activeTab === 'radix' ? 'tab-button-active' : ''}`}
          onClick={() => setActiveTab('radix')}
          type="button"
        >
          Radix Conversion
        </button>
        <button
          className={`tab-button ${activeTab === 'voltage' ? 'tab-button-active' : ''}`}
          onClick={() => setActiveTab('voltage')}
          type="button"
        >
          Electrical Helper
        </button>
      </div>

      {activeTab === 'radix' ? (
        <>
          <div className="card">
            <label htmlFor="inputFormat">Input Format</label>
            <select
              id="inputFormat"
              value={inputFormat}
              onChange={(e) => {
                setInputFormat(e.target.value)
                setInput('')
                setResults(emptyRadixResults)
                setError('')
              }}
            >
              <option value="hex">Hexadecimal</option>
              <option value="decimal">Decimal</option>
              <option value="binary">Binary</option>
              <option value="octal">Octal</option>
            </select>

            <label htmlFor="valueInput" style={{ marginTop: '16px' }}>Value</label>
            <input
              id="valueInput"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                inputFormat === 'hex'
                  ? 'e.g. 1A3F'
                  : inputFormat === 'binary'
                    ? 'e.g. 11010000'
                    : inputFormat === 'octal'
                      ? 'e.g. 7755'
                      : 'e.g. 6720'
              }
              autoFocus
            />
            {error && <p className="error">{error}</p>}

            <div className="button-row">
              <button className="btn-convert" onClick={handleConvert} type="button">Convert</button>
              <button className="btn-clear" onClick={resetRadixState} type="button">Clear</button>
            </div>
          </div>

          {results.decimal !== '' && (
            <div className="results card">
              <h2>Results</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Hexadecimal</td>
                    <td><strong>0x{results.hex}</strong></td>
                  </tr>
                  <tr>
                    <td>Decimal</td>
                    <td><strong>{results.decimal}</strong></td>
                  </tr>
                  <tr>
                    <td>Binary</td>
                    <td><strong>{results.binary}</strong></td>
                  </tr>
                  <tr>
                    <td>Octal</td>
                    <td><strong>{results.octal}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="card">
            <label htmlFor="vrmsInput">Vrms Input</label>
            <input
              id="vrmsInput"
              type="text"
              value={vrmsInput}
              onChange={(e) => setVrmsInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 230"
            />
            <label htmlFor="waveform" style={{ marginTop: '16px' }}>Waveform</label>
            <select
              id="waveform"
              value={waveform}
              onChange={(e) => setWaveform(e.target.value)}
            >
              <option value="sine">Sine wave</option>
              <option value="square">Square wave</option>
              <option value="triangle">Triangle wave</option>
            </select>
            <p className="helper-text">Formulas: Vpeak = Vrms × √2, Vpp = 2 × Vpeak</p>
            {voltageError && <p className="error">{voltageError}</p>}

            <div className="button-row">
              <button className="btn-convert" onClick={handleVoltageConvert} type="button">Calculate</button>
              <button className="btn-clear" onClick={resetVoltageState} type="button">Clear</button>
            </div>
          </div>

          {voltageResults.peak !== '' && (
            <div className="results card">
              <h2>Voltage Results</h2>
              <table>
                <tbody>
                  <tr>
                    <td>Vrms</td>
                    <td><strong>{formatVoltage(vrmsInput)} V</strong></td>
                  </tr>
                  <tr>
                    <td>Vpeak</td>
                    <td><strong>{formatVoltage(voltageResults.peak)} V</strong></td>
                  </tr>
                  <tr>
                    <td>Vpp</td>
                    <td><strong>{formatVoltage(voltageResults.peakToPeak)} V</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {voltageResults.peak !== '' && (
            <WaveformPreview
              waveform={waveform}
              vrms={vrmsInput}
              peak={voltageResults.peak}
              peakToPeak={voltageResults.peakToPeak}
            />
          )}
        </>
      )}
    </div>
  )
}

export default App

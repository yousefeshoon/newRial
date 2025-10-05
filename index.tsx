import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

type Mode = 'toman' | 'old_rial' | 'rial';

const toPersianNumerals = (str: string | number): string => {
    if (str === null || str === undefined) return '';
    const persianMap = {
        '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴',
        '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹',
        '.': '٫', ',': '٬'
    };
    return String(str).replace(/[0-9.,]/g, (char) => persianMap[char as keyof typeof persianMap] || char);
};

const toEnglishNumerals = (str: string): string => {
    if (str === null || str === undefined) return '';
    const englishMap = {
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
        '٫': '.', '٬': ','
    };
    return String(str).replace(/[۰-۹٫٬]/g, (char) => englishMap[char as keyof typeof englishMap] || char);
};

const App = () => {
    const [mode, setMode] = useState<Mode>('toman');
    const [tomanInput, setTomanInput] = useState('');
    const [rialInput, setRialInput] = useState('');
    const [oldRialInput, setOldRialInput] = useState('');
    const [copyStatus, setCopyStatus] = useState('');

    const formatNumber = (num: number): string => {
        if (isNaN(num)) return '';
        const englishToman = toEnglishNumerals(tomanInput);
        const englishRial = toEnglishNumerals(rialInput);
        if (num === 0 && (englishToman === '0' || englishRial === '0' || toEnglishNumerals(oldRialInput) === '0')) return '0';
        if (num === 0) return '';
        return num.toLocaleString('en-US', { maximumFractionDigits: 20 });
    };

    const parseNumber = (str: string): number => {
        if (!str) return 0;
        const englishStr = toEnglishNumerals(str);
        return parseFloat(englishStr.replace(/,/g, ''));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const { value } = e.target;
        const englishValue = toEnglishNumerals(value);

        // Prevent more than one dot
        if (englishValue.split('.').length > 2) {
            return;
        }
        // Allow only valid characters
        if (englishValue && !/^[0-9,.]*$/.test(englishValue)) {
            return;
        }

        const valueWithoutCommas = englishValue.replace(/,/g, '');

        if (valueWithoutCommas.trim() === '') {
            setter('');
            return;
        }

        // Handle user typing "." -> show "0."
        if (valueWithoutCommas === '.') {
            setter(toPersianNumerals('0.'));
            return;
        }
        
        const [integerPart, decimalPart] = valueWithoutCommas.split('.');
        
        try {
            // Format integer part with commas
            const formattedInteger = BigInt(integerPart || '0').toLocaleString('en-US');
    
            let finalValue = formattedInteger;
            
            // Append decimal part if it exists
            if (decimalPart !== undefined) {
                finalValue = formattedInteger + '.' + decimalPart;
            }
            
            // Handle cases where integer part was empty (e.g., user types ".5")
            if (integerPart === '') {
                finalValue = '0.' + (decimalPart || '');
            }
    
            setter(toPersianNumerals(finalValue));
        } catch (error) {
            // Ignore invalid BigInt inputs
            return;
        }
    };
    
    const handleShare = async () => {
        const shareData = {
            title: 'مبدل واحد پولی جدید ایران',
            text: 'یک ابزار ساده برای تبدیل تومان، ریال جدید و قران به یکدیگر بر اساس سیستم پولی جدید ایران.',
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error("Share failed:", err);
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopyStatus('لینک کپی شد!');
                setTimeout(() => setCopyStatus(''), 2000);
            } catch (err) {
                setCopyStatus('کپی ناموفق بود.');
                setTimeout(() => setCopyStatus(''), 2000);
                console.error('Failed to copy: ', err);
            }
        }
    };

    const renderTomanCalculator = () => {
        const numericValue = parseNumber(tomanInput);
        let result = null;
        if (numericValue > 0) {
            const newRialEquivalent = numericValue / 1000;
            const rials = Math.floor(newRialEquivalent);
            const qirans = Math.round((newRialEquivalent - rials) * 100);

            result = {
                decimal: newRialEquivalent,
                rials: rials,
                qirans: qirans,
            };
        }
        return (
            <>
                <div className="input-group">
                    <label htmlFor="tomanInput">مبلغ به تومان</label>
                    <input
                        type="text"
                        id="tomanInput"
                        name="tomanInput"
                        inputMode="decimal"
                        placeholder="مثلاً ۱۲۲٬۸۰۰"
                        value={tomanInput}
                        onChange={(e) => handleInputChange(e, setTomanInput)}
                        aria-label="مبلغ به تومان"
                        autoComplete="off"
                    />
                </div>
                {result && (
                    <div className="purchase-result" aria-live="polite">
                        <p><strong>مبلغ قابل پرداخت:</strong> {toPersianNumerals(formatNumber(result.rials))} ریال جدید{result.qirans > 0 ? ` و ${toPersianNumerals(formatNumber(result.qirans))} قران` : ''}</p>
                    </div>
                )}
            </>
        );
    };

    const renderOldRialCalculator = () => {
        const numericValue = parseNumber(oldRialInput);
        let result = null;
        if (numericValue > 0) {
            const newRialEquivalent = numericValue / 10000;
            const rials = Math.floor(newRialEquivalent);
            const qirans = Math.round((newRialEquivalent - rials) * 100);

            result = {
                decimal: newRialEquivalent,
                rials: rials,
                qirans: qirans,
            };
        }
        return (
            <>
                <div className="input-group">
                    <label htmlFor="oldRialInput">مبلغ به ریال قدیم</label>
                    <input
                        type="text"
                        id="oldRialInput"
                        name="oldRialInput"
                        inputMode="decimal"
                        placeholder="مثلاً ۱٬۲۲۸٬۰۰۰"
                        value={oldRialInput}
                        onChange={(e) => handleInputChange(e, setOldRialInput)}
                        aria-label="مبلغ به ریال قدیم"
                        autoComplete="off"
                    />
                </div>
                {result && (
                    <div className="purchase-result" aria-live="polite">
                        <p><strong>مبلغ قابل پرداخت:</strong> {toPersianNumerals(formatNumber(result.rials))} ریال جدید{result.qirans > 0 ? ` و ${toPersianNumerals(formatNumber(result.qirans))} قران` : ''}</p>
                    </div>
                )}
            </>
        );
    };

    const renderRialCalculator = () => {
        const numericValue = parseNumber(rialInput);
        let result = null;
        if (numericValue > 0) {
            result = {
                toman: numericValue * 1000,
            };
        }
        return (
            <>
                <div className="input-group">
                    <label htmlFor="rialInput">مبلغ به ریال جدید</label>
                    <input
                        type="text"
                        id="rialInput"
                        name="rialInput"
                        inputMode="decimal"
                        placeholder="مثلاً ۱۲۲٫۸۰"
                        value={rialInput}
                        onChange={(e) => handleInputChange(e, setRialInput)}
                        aria-label="مبلغ به ریال جدید"
                        autoComplete="off"
                    />
                </div>
                {result && (
                     <div className="purchase-result" aria-live="polite">
                        <p><strong>معادل به تومان:</strong> {toPersianNumerals(formatNumber(result.toman))} تومان</p>
                    </div>
                )}
            </>
        );
    };

    return (
        <>
            <div className="converter-container" role="main" aria-labelledby="app-title">
                <h1 id="app-title">محاسبه خرید</h1>
                
                <div className="tabs-container" role="tablist">
                    <button 
                        role="tab" 
                        aria-selected={mode === 'toman'} 
                        className={`tab-button ${mode === 'toman' ? 'active' : ''}`} 
                        onClick={() => setMode('toman')}
                    >
                        ورود به تومان
                    </button>
                    <button 
                        role="tab" 
                        aria-selected={mode === 'old_rial'} 
                        className={`tab-button ${mode === 'old_rial' ? 'active' : ''}`} 
                        onClick={() => setMode('old_rial')}
                    >
                        ورود به ریال قدیم
                    </button>
                    <button 
                        role="tab" 
                        aria-selected={mode === 'rial'} 
                        className={`tab-button ${mode === 'rial' ? 'active' : ''}`} 
                        onClick={() => setMode('rial')}
                    >
                        ورود به ریال جدید
                    </button>
                </div>

                {mode === 'toman' && renderTomanCalculator()}
                {mode === 'old_rial' && renderOldRialCalculator()}
                {mode === 'rial' && renderRialCalculator()}
                
            </div>
            <div className="share-section">
                <button className="share-button" onClick={handleShare}>
                    معرفی برنامه به دیگران
                </button>
                {copyStatus && <p className="copy-status" aria-live="polite">{copyStatus}</p>}
            </div>
        </>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = createRoot(container);
    root.render(<React.StrictMode><App /></React.StrictMode>);
}
import React, { useState } from 'react';
import { X, Ruler, Sparkles, AlertCircle } from 'lucide-react';

export function SmartSizeGuideModal({ isOpen, onClose, category, sizeGuideData }) {
  const [unit, setUnit] = useState('in'); // 'in' or 'cm'
  const [chestInput, setChestInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [calculatedSize, setCalculatedSize] = useState(null);

  if (!isOpen) return null;

  const measurements = sizeGuideData?.measurements || [];

  // Interactive Size Estimator Logic
  const handleEstimate = (e) => {
    e.preventDefault();
    const c = parseFloat(chestInput);
    if (isNaN(c) || c <= 0) return;

    // Convert to inches for estimation comparison if input was cm
    const chestInches = unit === 'cm' ? c / 2.54 : c;

    if (category?.toLowerCase().includes('suit') || category?.toLowerCase().includes('shirt')) {
      if (chestInches < 39) setCalculatedSize('38R / Small');
      else if (chestInches < 41) setCalculatedSize('40R / Medium');
      else if (chestInches < 43) setCalculatedSize('42R / Large');
      else if (chestInches < 45) setCalculatedSize('44R / XL');
      else setCalculatedSize('46R / XXL');
    } else if (category?.toLowerCase().includes('abaya')) {
      setCalculatedSize('54 or 56 (Standard Height 5\'3" - 5\'6")');
    } else {
      if (chestInches < 37) setCalculatedSize('Small (S)');
      else if (chestInches < 40) setCalculatedSize('Medium (M)');
      else if (chestInches < 43) setCalculatedSize('Large (L)');
      else setCalculatedSize('Extra Large (XL)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-hero-fade">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6 sm:p-8"
        style={{
          backgroundColor: 'var(--card-bg)',
          borderColor: 'var(--border-medium)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-400/20 text-amber-500">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold">
                Smart Size Guide: {category || 'Couture Garment'}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Handcrafted precision specifications & tailored measurements
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unit Selector */}
        <div className="flex justify-between items-center my-5">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            Measurement Table:
          </span>
          <div className="flex items-center p-1 rounded-lg border text-xs font-mono" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setUnit('in')}
              className={`px-3 py-1 rounded-md transition-colors ${unit === 'in' ? 'bg-amber-400 text-stone-950 font-bold' : 'opacity-70'}`}
            >
              Inches (in)
            </button>
            <button
              onClick={() => setUnit('cm')}
              className={`px-3 py-1 rounded-md transition-colors ${unit === 'cm' ? 'bg-amber-400 text-stone-950 font-bold' : 'opacity-70'}`}
            >
              Centimeters (cm)
            </button>
          </div>
        </div>

        {/* Measurement Table */}
        {measurements.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
            <table className="w-full text-xs text-left">
              <thead className="uppercase tracking-wider font-semibold border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
                <tr>
                  {Object.keys(measurements[0]).map((col) => (
                    <th key={col} className="py-3 px-4 capitalize">
                      {col.replace('_', ' ')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {measurements.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-500/5 transition-colors">
                    {Object.entries(row).map(([k, val], cIdx) => {
                      const numVal = parseFloat(val);
                      const displayVal = !isNaN(numVal) && k !== 'size' && k !== 'client_height'
                        ? (unit === 'cm' ? (numVal * 2.54).toFixed(1) : numVal)
                        : val;
                      return (
                        <td key={cIdx} className={`py-3 px-4 ${k === 'size' ? 'font-bold font-mono text-amber-500' : ''}`}>
                          {displayVal}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs italic py-4" style={{ color: 'var(--text-muted)' }}>
            Standard boutique sizing applies. Custom made-to-measure tailoring available upon request.
          </p>
        )}

        {/* Interactive Measurement Calculator */}
        <div className="p-4 rounded-xl border mt-4" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs uppercase font-bold tracking-wider">
              Interactive Fit Recommendation
            </h4>
          </div>
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
            Enter your natural body measurements for an immediate suggested garment size.
          </p>

          <form onSubmit={handleEstimate} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1">
                Chest / Bust ({unit})
              </label>
              <input
                type="number"
                step="0.5"
                value={chestInput}
                onChange={(e) => setChestInput(e.target.value)}
                placeholder={unit === 'in' ? 'e.g. 40' : 'e.g. 102'}
                className="w-full text-xs p-2 rounded-lg border bg-transparent"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider block mb-1">
                Waist ({unit})
              </label>
              <input
                type="number"
                step="0.5"
                value={waistInput}
                onChange={(e) => setWaistInput(e.target.value)}
                placeholder={unit === 'in' ? 'e.g. 34' : 'e.g. 86'}
                className="w-full text-xs p-2 rounded-lg border bg-transparent"
                style={{ borderColor: 'var(--border-subtle)' }}
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-xs"
                style={{
                  backgroundColor: 'var(--btn-primary-bg)',
                  color: 'var(--btn-primary-text)'
                }}
              >
                Calculate Fit
              </button>
            </div>
          </form>

          {calculatedSize && (
            <div className="mt-3 p-3 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-600 dark:text-amber-400 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold uppercase tracking-wider text-[10px] block">Recommended Sizing:</span>
                <span className="text-sm font-bold font-serif">{calculatedSize}</span>
              </div>
              <span className="text-[10px] italic opacity-80 max-w-[200px] text-right">
                Based on tailored drape standards
              </span>
            </div>
          )}
        </div>

        {/* Disclaimer Note */}
        <div className="flex items-start gap-2 mt-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
          <p>
            Fitting advice is indicative. For custom bespoke bridal, sherwani, or made-to-measure alterations, connect with our WhatsApp master tailor directly.
          </p>
        </div>

      </div>
    </div>
  );
}

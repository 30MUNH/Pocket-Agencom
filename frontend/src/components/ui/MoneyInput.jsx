import { Minus, Plus } from 'lucide-react';

const DEFAULT_STEP = 100000;

/**
 * Ô nhập tiền VND: hiển thị theo định dạng X.XXX.XXX (vi-VN),
 * kèm nút +/- thay đổi theo bước `step` (mặc định 100.000).
 * onChange nhận về number ('' khi người dùng xóa hết).
 */
export default function MoneyInput({
  value,
  onChange,
  step = DEFAULT_STEP,
  min = 0,
  placeholder = '1.000.000',
  className = '',
  inputClassName = '',
  prefix,
  id,
}) {
  const numericValue =
    value === '' || value === null || value === undefined ? '' : Number(value);
  const display =
    numericValue === '' || Number.isNaN(numericValue)
      ? ''
      : numericValue.toLocaleString('vi-VN');

  const handleInput = (e) => {
    const digits = e.target.value.replace(/\D/g, '');
    onChange(digits === '' ? '' : Number(digits));
  };

  const adjust = (delta) => {
    const base =
      numericValue === '' || Number.isNaN(numericValue) ? 0 : numericValue;
    onChange(Math.max(min, base + delta));
  };

  const stepLabel = step.toLocaleString('vi-VN');

  return (
    <div className={`relative ${className}`}>
      {prefix && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-xs pointer-events-none flex items-center">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleInput}
        placeholder={placeholder}
        className={inputClassName}
      />
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <button
          type="button"
          aria-label={`Giảm ${stepLabel}`}
          onClick={() => adjust(-step)}
          className="w-7 h-7 rounded-lg bg-surface-container-high dark:bg-surface-variant/40 text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container active:scale-95 flex items-center justify-center transition-all"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          aria-label={`Tăng ${stepLabel}`}
          onClick={() => adjust(step)}
          className="w-7 h-7 rounded-lg bg-surface-container-high dark:bg-surface-variant/40 text-on-surface-variant hover:bg-secondary-container hover:text-on-secondary-container active:scale-95 flex items-center justify-center transition-all"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

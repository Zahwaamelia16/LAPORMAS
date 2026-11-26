
import React, {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';

function getText(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getText).join('');
  }

  if (React.isValidElement(node)) {
    return getText(node.props.children);
  }

  return '';
}

export default function CustomSelect({
  value,
  onChange,
  children,
  className = '',
  disabled = false,
  required = false,
  searchable,
  placeholder = 'Pilih pilihan',
  ...props
}) {
  const id = useId();

  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState({});

  const ariaLabel = props['aria-label'];
  const ariaLabelledBy = props['aria-labelledby'];

  // Membaca seluruh option seperti select HTML biasa.
  const options = useMemo(() => {
    return React.Children.toArray(children)
      .filter(
        (child) =>
          React.isValidElement(child) &&
          child.type === 'option'
      )
      .map((child) => {
        const label = getText(child.props.children);
        const optionValue = child.props.value ?? label;

        return {
          value: String(optionValue),
          label,
          disabled: Boolean(child.props.disabled),
        };
      });
  }, [children]);

  const selectedOption = options.find(
    (option) => option.value === String(value ?? '')
  );

  const showSearch = searchable ?? options.length >= 8;

  const filteredOptions = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    if (!keyword) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(keyword)
    );
  }, [options, query]);

  const selectedLabel = selectedOption?.label || placeholder;

  const closeMenu = () => {
    setOpen(false);
    setQuery('');
  };

  const chooseOption = (option) => {
    if (!option || option.disabled) return;

    onChange?.({
      target: {
        value: option.value,
      },
    });

    closeMenu();
    triggerRef.current?.focus();
  };

  const openMenu = () => {
    if (disabled) return;

    const selectedIndex = filteredOptions.findIndex(
      (option) => option.value === String(value ?? '')
    );

    setActiveIndex(Math.max(0, selectedIndex));
    setQuery('');
    setOpen(true);
  };

  // Posisi popup mengikuti posisi tombol dropdown.
  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const openUp =
        spaceBelow < 260 && spaceAbove > spaceBelow;

      setMenuStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(
          130,
          Math.min(320, openUp ? spaceAbove - 12 : spaceBelow - 12)
        ),
        ...(openUp
          ? {
              bottom: window.innerHeight - rect.top + 6,
              top: 'auto',
            }
          : {
              top: rect.bottom + 6,
              bottom: 'auto',
            }),
      });
    };

    const handleOutsideClick = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        closeMenu();
      }
    };

    updatePosition();

    document.addEventListener(
      'pointerdown',
      handleOutsideClick
    );

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const frame = requestAnimationFrame(() => {
      if (showSearch) {
        searchRef.current?.focus();
      }
    });

    return () => {
      cancelAnimationFrame(frame);

      document.removeEventListener(
        'pointerdown',
        handleOutsideClick
      );

      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, showSearch]);

  // Navigasi keyboard.
  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();

      if (!open) {
        openMenu();
        return;
      }

      setActiveIndex((current) =>
        Math.min(current + 1, filteredOptions.length - 1)
      );
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();

      if (!open) {
        openMenu();
        return;
      }

      setActiveIndex((current) => Math.max(0, current - 1));
    }

    if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    }

    if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      closeMenu();
    }

    if (
      (event.key === 'Enter' || event.key === ' ') &&
      !open
    ) {
      event.preventDefault();
      openMenu();
    } else if (
      event.key === 'Enter' &&
      open
    ) {
      event.preventDefault();
      chooseOption(filteredOptions[activeIndex]);
    }
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      const direction = event.key === 'ArrowDown' ? 1 : -1;

      setActiveIndex((current) =>
        Math.max(
          0,
          Math.min(current + direction, filteredOptions.length - 1)
        )
      );
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      chooseOption(filteredOptions[activeIndex]);
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    }
  };

  const hiddenSelect = (
    <select
      className="custom-select-native"
      value={value ?? ''}
      required={required}
      disabled={disabled}
      tabIndex={-1}
      aria-hidden="true"
      onChange={() => {}}
      onInvalid={() => triggerRef.current?.focus()}
    >
      {children}
    </select>
  );

  return (
    <div
      ref={rootRef}
      className={`custom-select ${className}`.trim()}
    >
      {hiddenSelect}

      <button
        ref={triggerRef}
        type="button"
        className={`custom-select-trigger ${open ? 'is-open' : ''}`}
        disabled={disabled}
        role="combobox"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={`${id}-listbox`}
        aria-activedescendant={
          open ? `${id}-option-${activeIndex}` : undefined
        }
        aria-required={required}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={handleKeyDown}
      >
        <span className="custom-select-value">
          {selectedLabel}
        </span>

        <ChevronDown
          size={17}
          className={`custom-select-arrow ${open ? 'rotated' : ''}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="custom-select-menu"
            style={menuStyle}
          >
            {showSearch && (
              <div className="custom-select-search">
                <Search size={16} aria-hidden="true" />

                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Cari pilihan..."
                  aria-label={`Cari ${ariaLabel || placeholder}`}
                  autoComplete="off"
                />
              </div>
            )}

            <div
              id={`${id}-listbox`}
              className="custom-select-options"
              role="listbox"
              aria-label={ariaLabel || placeholder}
            >
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const selected =
                    option.value === String(value ?? '');

                  return (
                    <div
                      key={`${option.value}-${index}`}
                      id={`${id}-option-${index}`}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={option.disabled}
                      className={[
                        'custom-select-option',
                        selected ? 'selected' : '',
                        activeIndex === index ? 'active' : '',
                        option.disabled ? 'disabled' : '',
                      ].filter(Boolean).join(' ')}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => chooseOption(option)}
                    >
                      <span>{option.label}</span>

                      {selected && (
                        <Check size={16} aria-hidden="true" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="custom-select-empty">
                  Pilihan tidak ditemukan.
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

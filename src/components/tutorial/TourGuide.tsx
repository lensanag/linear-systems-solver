import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface TourGuideProps {
  isActive: boolean;
  onComplete: () => void;
  onExit: () => void;
}

interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
}

const TOUR_STEPS: Record<string, TourStep[]> = {
  en: [
    {
      element: '#mode-selector',
      popover: {
        title: 'Mode Selection',
        description: 'Choose between Numeric mode (fraction arithmetic) or Symbolic mode (with parameters).',
        position: 'bottom',
      },
    },
    {
      element: '#method-selector',
      popover: {
        title: 'Method Selection',
        description: 'Select a solving method. Some methods are only available for square systems.',
        position: 'bottom',
      },
    },
    {
      element: '#matrix-editor',
      popover: {
        title: 'Matrix Editor',
        description: 'Enter your system coefficients. The last column is the constant term (b).',
        position: 'right',
      },
    },
    {
      element: '#solve-button',
      popover: {
        title: 'Solve',
        description: 'Click to execute the selected method and see step-by-step solution.',
        position: 'top',
      },
    },
    {
      element: '#step-panel',
      popover: {
        title: 'Solution Steps',
        description: 'View each step of the algorithm with matrix transformations.',
        position: 'left',
      },
    },
    {
      element: '#history-tab',
      popover: {
        title: 'History',
        description: 'Access previously solved systems.',
        position: 'bottom',
      },
    },
  ],
  es: [
    {
      element: '#mode-selector',
      popover: {
        title: 'Selección de Modo',
        description: 'Elige entre modo Numérico (aritmética de fracciones) o Simbólico (con parámetros).',
        position: 'bottom',
      },
    },
    {
      element: '#method-selector',
      popover: {
        title: 'Selección de Método',
        description: 'Selecciona un método de resolución. Algunos métodos solo están disponibles para sistemas cuadrados.',
        position: 'bottom',
      },
    },
    {
      element: '#matrix-editor',
      popover: {
        title: 'Editor de Matriz',
        description: 'Ingresa los coeficientes de tu sistema. La última columna es el término constante (b).',
        position: 'right',
      },
    },
    {
      element: '#solve-button',
      popover: {
        title: 'Resolver',
        description: 'Haz clic para ejecutar el método seleccionado y ver la solución paso a paso.',
        position: 'top',
      },
    },
    {
      element: '#step-panel',
      popover: {
        title: 'Pasos de la Solución',
        description: 'Visualiza cada paso del algoritmo con las transformaciones de la matriz.',
        position: 'left',
      },
    },
    {
      element: '#history-tab',
      popover: {
        title: 'Historial',
        description: 'Accede a sistemas resueltos anteriormente.',
        position: 'bottom',
      },
    },
  ],
};

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function TourGuide({ isActive, onComplete, onExit }: TourGuideProps) {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const lang = i18n.language === 'en' ? 'en' : 'es';
  const steps = TOUR_STEPS[lang];

  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const updateTargetRect = () => {
      const currentStepData = steps[currentStep];
      if (!currentStepData) return;

      const element = document.querySelector(currentStepData.element);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        });
      } else {
        setTargetRect(null);
      }
    };

    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [isActive, currentStep, steps]);

  if (!isActive) return null;

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getPopoverPosition = () => {
    if (!targetRect) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 10;
    const popoverWidth = 320;
    const popoverHeight = 180;

    switch (currentStepData.popover.position) {
      case 'top':
        return {
          top: `${targetRect.top - popoverHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`,
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - popoverWidth / 2}px`,
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`,
          left: `${targetRect.left - popoverWidth - padding}px`,
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2 - popoverHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  };

  const getHighlightPosition = () => {
    if (!targetRect) return { top: '0px', left: '0px', width: '0px', height: '0px' };
    return {
      top: `${targetRect.top - 4}px`,
      left: `${targetRect.left - 4}px`,
      width: `${targetRect.width + 8}px`,
      height: `${targetRect.height + 8}px`,
    };
  };

  const popoverStyle = getPopoverPosition();
  const highlightStyle = getHighlightPosition();

  return (
    <div className="fixed inset-0 bg-black/30 z-[60]">
      {targetRect && (
        <div
          className="absolute border-2 border-blue-500 rounded-lg shadow-lg pointer-events-none"
          style={{
            top: highlightStyle.top,
            left: highlightStyle.left,
            width: highlightStyle.width,
            height: highlightStyle.height,
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
          }}
        />
      )}

      <div
        ref={popoverRef}
        className="absolute z-[70] bg-white rounded-lg shadow-xl max-w-sm p-4 border border-gray-200"
        style={popoverStyle}
      >
        <div className="absolute w-3 h-3 bg-white border-gray-200 rotate-45"
          style={{
            ...(currentStepData.popover.position === 'top' && { bottom: '-6px', left: '50%', marginLeft: '-6px', borderBottom: 'none', borderRight: 'none' }),
            ...(currentStepData.popover.position === 'bottom' && { top: '-6px', left: '50%', marginLeft: '-6px', borderTop: 'none', borderLeft: 'none' }),
            ...(currentStepData.popover.position === 'left' && { right: '-6px', top: '50%', marginTop: '-6px', borderLeft: 'none', borderTop: 'none' }),
            ...(currentStepData.popover.position === 'right' && { left: '-6px', top: '50%', marginTop: '-6px', borderRight: 'none', borderBottom: 'none' }),
          }}
        />
        <h3 className="text-base font-bold mb-2 text-gray-800">{currentStepData.popover.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{currentStepData.popover.description}</p>
        <div className="flex justify-between items-center">
          <button
            onClick={onExit}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
          >
            {t('tourGuide.exit')}
          </button>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-400">
              {currentStep + 1} / {steps.length}
            </span>
            <div className="flex gap-1">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                >
                  {t('tourGuide.prev')}
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                {currentStep < steps.length - 1 ? t('tourGuide.next') : t('tourGuide.done')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
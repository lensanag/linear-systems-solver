import { useEffect, useState } from 'react';
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
    position: string;
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
        position: 'top',
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
      element: '#export-menu',
      popover: {
        title: 'Export',
        description: 'Export your solution to PDF, PNG, or LaTeX format.',
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
        title: 'Seleccion de Modo',
        description: 'Elige entre modo Numerico (aritmetica de fracciones) o Simbolico (con parametros).',
        position: 'bottom',
      },
    },
    {
      element: '#method-selector',
      popover: {
        title: 'Seleccion de Metodo',
        description: 'Selecciona un metodo de resolucion. Algunos metodos solo estan disponibles para sistemas cuadrados.',
        position: 'bottom',
      },
    },
    {
      element: '#matrix-editor',
      popover: {
        title: 'Editor de Matriz',
        description: 'Ingresa los coeficientes de tu sistema. La ultima columna es el termino constante (b).',
        position: 'top',
      },
    },
    {
      element: '#solve-button',
      popover: {
        title: 'Resolver',
        description: 'Haz clic para ejecutar el metodo seleccionado y ver la solucion paso a paso.',
        position: 'top',
      },
    },
    {
      element: '#step-panel',
      popover: {
        title: 'Pasos de la Solucion',
        description: 'Visualiza cada paso del algoritmo con las transformaciones de la matriz.',
        position: 'left',
      },
    },
    {
      element: '#export-menu',
      popover: {
        title: 'Exportar',
        description: 'Exporta tu solucion a formato PDF, PNG o LaTeX.',
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

export function TourGuide({ isActive, onComplete, onExit }: TourGuideProps) {
  const { t, i18n } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const lang = i18n.language === 'en' ? 'en' : 'es';
  const steps = TOUR_STEPS[lang];

  useEffect(() => {
    if (isActive) {
      setCurrentStep(0);
    }
  }, [isActive]);

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

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

  if (!currentStepData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md p-6">
        <h3 className="text-lg font-bold mb-2">{currentStepData.popover.title}</h3>
        <p className="text-gray-600 mb-4">{currentStepData.popover.description}</p>
        <div className="flex justify-between">
          <button
            onClick={onExit}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          >
            {t('tourGuide.exit')}
          </button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                {t('tourGuide.prev')}
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            >
              {currentStep < steps.length - 1
                ? t('tourGuide.next')
                : t('tourGuide.done')}
            </button>
          </div>
        </div>
        <div className="mt-4 text-center text-sm text-gray-500">
          {currentStep + 1} / {steps.length}
        </div>
      </div>
    </div>
  );
}

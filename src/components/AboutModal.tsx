import { useTranslation } from 'react-i18next';
import { X, Info } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  if (!isOpen) return null;

  const content = isSpanish ? {
    title: 'Acerca de',
    description: `Solver de Sistemas de Ecuaciones Lineales es una herramienta educativa diseñada para ayudarte a comprender y resolver sistemas de ecuaciones lineales utilizando diversos métodos matriciales.`,
    features: 'Características principales:',
    feature1: 'Resolución paso a paso con visualización de cada operación',
    feature2: 'Múltiples métodos: Eliminación Gaussiana, Gauss-Jordan, Regla de Cramer, Matriz Inversa y Descomposición LU',
    feature3: 'Soporte para modos numérico y simbólico',
    feature4: 'Exporta tus soluciones a PDF, PNG o LaTeX',
    howToUse: '¿Cómo usar?',
    howToUseDesc: 'Ingresa los coeficientes de tu sistema de ecuaciones, selecciona un método de resolución y presiona "Ejecutar" para ver la solución paso a paso.',
    version: 'Versión',
  } : {
    title: 'About',
    description: `Linear Systems Solver is an educational tool designed to help you understand and solve systems of linear equations using various matrix methods.`,
    features: 'Main features:',
    feature1: 'Step-by-step resolution with visualization of each operation',
    feature2: 'Multiple methods: Gaussian Elimination, Gauss-Jordan, Cramer\'s Rule, Inverse Matrix, and LU Decomposition',
    feature3: 'Support for numeric and symbolic modes',
    feature4: 'Export your solutions to PDF, PNG, or LaTeX',
    howToUse: 'How to use?',
    howToUseDesc: 'Enter the coefficients of your equation system, select a solving method, and press "Solve" to see the step-by-step solution.',
    version: 'Version',
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl max-w-lg w-full mx-4 border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-text-primary">{content.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-primary w-6 h-6 flex items-center justify-center rounded hover:bg-border"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-text-secondary leading-relaxed">
            {content.description}
          </p>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">{content.features}</h3>
            <ul className="text-xs text-text-secondary space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {content.feature1}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {content.feature2}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {content.feature3}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                {content.feature4}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">{content.howToUse}</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {content.howToUseDesc}
            </p>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-text-muted">
              {content.version} 1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
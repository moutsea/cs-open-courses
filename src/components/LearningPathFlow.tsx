import { memo } from 'react';

interface LearningPathFlowProps {
  steps: Array<{
    title: string;
  }>;
}

const LearningPathFlow = memo(function LearningPathFlow({ steps }: LearningPathFlowProps) {

  const getStepColors = (index: number) => {
    const colorSchemes = [
      { from: 'from-blue-500', to: 'to-blue-600', border: 'border-blue-200', bg: 'bg-blue-50' },
      { from: 'from-indigo-500', to: 'to-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50' },
      { from: 'from-purple-500', to: 'to-purple-600', border: 'border-purple-200', bg: 'bg-purple-50' },
      { from: 'from-pink-500', to: 'to-pink-600', border: 'border-pink-200', bg: 'bg-pink-50' },
      { from: 'from-red-500', to: 'to-red-600', border: 'border-red-200', bg: 'bg-red-50' },
      { from: 'from-orange-500', to: 'to-orange-600', border: 'border-orange-200', bg: 'bg-orange-50' },
      { from: 'from-green-500', to: 'to-green-600', border: 'border-green-200', bg: 'bg-green-50' },
    ];
    return colorSchemes[index % colorSchemes.length];
  };

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      </div>

      <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 max-w-full mx-auto px-2">
        {steps.map((step, index) => {
          const colors = getStepColors(index);
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="relative flex items-center">
              {/* Step circle and content */}
              <div className="group">
                {/* Step number circle */}
                <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gradient-to-r ${colors.from} ${colors.to} rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                  {index + 1}
                </div>

                {/* Step content */}
                <div className={`relative pt-2 px-4 py-3 bg-white ${colors.border} border-2 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-105 min-w-[120px] max-w-[140px] text-center`}>
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${colors.from} ${colors.to} rounded-t-2xl`}></div>

                  {/* Content */}
                  <div className="mt-2">
                    <h3 className={`text-sm font-semibold text-gray-800 group-hover:${colors.to.replace('to-', 'text-')} transition-colors duration-200`}>
                      {step.title}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Connector */}
              {!isLast && (
                <div className="hidden md:block mx-2">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-gray-300 to-gray-400 relative">
                    <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile connector dots */}
      <div className="md:hidden mt-6 flex justify-center gap-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 bg-gray-300 rounded-full"
            style={{
              backgroundColor: index < steps.length - 1 ? '#d1d5db' : '#6366f1'
            }}
          ></div>
        ))}
      </div>
    </div>
  );
});

export default LearningPathFlow;
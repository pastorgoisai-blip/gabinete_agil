import React from 'react';

const EditorRuler: React.FC = () => {
    // A4 width = 210mm (~21cm)
    const rulerWidth = 210; // in mm
    const markers = [];

    for (let i = 0; i <= 21; i++) {
        markers.push(
            <div
                key={i}
                className="absolute top-0 h-full flex flex-col justify-end"
                style={{ left: `${i * 10}mm` }}
            >
                <div className="h-2 w-px bg-slate-400"></div>
                {i > 0 && <span className="text-[8px] text-slate-500 -ml-1 mt-0.5">{i}</span>}
            </div>
        );
        // Half cm marker
        if (i < 21) {
            markers.push(
                <div
                    key={`half-${i}`}
                    className="absolute top-2 h-2 w-px bg-slate-300"
                    style={{ left: `${(i * 10) + 5}mm` }}
                />
            );
        }
    }

    return (
        <div className="w-[210mm] h-8 bg-gray-50 border-b border-gray-200 relative mx-auto mb-0 select-none print:hidden">
            {/* Ticks & Numbers */}
            {markers}

            {/* Margin Indicators (Official 3cm Left, 1.5cm Right) */}
            {/* Left Margin (3cm) */}
            <div className="absolute top-0 w-px h-full bg-blue-500/50 z-10" style={{ left: '30mm' }}>
                <div className="absolute top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600"></div>
            </div>

            {/* Right Margin (21cm - 1.5cm = 19.5cm) */}
            <div className="absolute top-0 w-px h-full bg-blue-500/50 z-10" style={{ left: '195mm' }}>
                <div className="absolute top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-600"></div>
            </div>
        </div>
    );
};

export default EditorRuler;

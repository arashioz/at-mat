'use client';

import { useState } from 'react';

const dimensions = [
  { name: 'گرم', level: 5, guidance: 'با لحنی نزدیک و محترمانه بنویس. یک موقعیت آشنا را توصیف کن تا خواننده خودش را در روایت ببیند.' },
  { name: 'راوی', level: 5, guidance: 'از یک جزئیات واقعی شروع کن، مثل نام یک بندر، شیوهٔ صید یا لحظه‌ای کنار سفره.' },
  { name: 'معاصر', level: 4, guidance: 'کوتاه و روشن بنویس. کاربرد طعم را به عادت‌های امروز، مثل یک ناهار سریع در محل کار، پیوند بده.' },
  { name: 'کنجکاو', level: 4, guidance: 'راه کشف را باز بگذار. از مخاطب بپرس این طعم را با چه ترکیبی امتحان می‌کند.' },
  { name: 'انتخاب‌گر', level: 4, guidance: 'یک دلیل مشخص برای انتخاب بده. جزئیات طعم یا کاربرد آن را دقیق و بی‌اغراق بیان کن.' },
];

const steps = [1, 2, 3, 4, 5];
const center = 100;
const radius = 81;
const levelFormat = new Intl.NumberFormat('fa-IR');

function point(axis: number, level: number) {
  const angle = (axis / dimensions.length) * Math.PI * 2 - Math.PI / 2;
  return [center + Math.cos(angle) * radius * level / 5, center + Math.sin(angle) * radius * level / 5];
}

function polygon(levels: number[]) {
  return levels.map((level, axis) => point(axis, level).join(',')).join(' ');
}

export function BrandVoice() {
  const [selected, setSelected] = useState(0);
  const [x, y] = point(selected, dimensions[selected].level);

  return <section className="brand-voice" aria-labelledby="brand-voice-guide">
    <div className="brand-voice-heading">
      <h3 id="brand-voice-guide">نقشهٔ لحن ات‌مت</h3>
      <p>مقیاس پیشنهادی تأکید از ۱ تا ۵. هر ویژگی را برای دیدن راهنمای نوشتن انتخاب کنید.</p>
    </div>
    <div className="brand-voice-layout">
      <svg className="brand-voice-radar" viewBox="-22 -6 244 207" role="img" aria-label={dimensions.map(({ name, level }) => `${name} ${levelFormat.format(level)} از ۵`).join('، ')}>
        {steps.map(level => <polygon className="brand-voice-ring" key={level} points={polygon(dimensions.map(() => level))} />)}
        {dimensions.map(({ name }, axis) => {
          const [axisX, axisY] = point(axis, 5);
          return <line className="brand-voice-ring" key={name} x1={center} y1={center} x2={axisX} y2={axisY} />;
        })}
        <polygon className="brand-voice-shape" points={polygon(dimensions.map(({ level }) => level))} />
        {dimensions.map(({ name, level }, axis) => {
          const [dotX, dotY] = point(axis, level);
          return <circle className="brand-voice-point" key={name} cx={dotX} cy={dotY} r="2.8" />;
        })}
        <circle className="brand-voice-point-active" cx={x} cy={y} r="5.5" />
        {dimensions.map(({ name }, axis) => {
          const [labelX, labelY] = point(axis, 5.87);
          return <text className="brand-voice-axis" key={name} x={labelX} y={labelY + 4} data-selected={axis === selected}>{name}</text>;
        })}
      </svg>
      <div className="brand-voice-notes">
        <div className="brand-voice-dimensions" role="group" aria-label="ویژگی‌های لحن">
          {dimensions.map(({ name, level }, axis) => <button key={name} type="button" aria-pressed={axis === selected} onClick={() => setSelected(axis)}>
            <span>{name}</span><small aria-label={`${levelFormat.format(level)} از ۵`}>{levelFormat.format(level)}</small>
          </button>)}
        </div>
        <div className="brand-voice-guidance" aria-live="polite">
          <p key={selected}><strong>{dimensions[selected].name}</strong>{dimensions[selected].guidance}</p>
        </div>
      </div>
    </div>
  </section>;
}

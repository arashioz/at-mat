import { BrandEdge } from './brand-edge';
import type { ProductNutrition } from '../products/types';
import './brine-nutrition.css';

export function BrineNutrition({ nutrition }: { nutrition: ProductNutrition }) {
  return (
    <section className="b-nutrition" id="nutrition" aria-labelledby="nutrition-title">
      <BrandEdge id="nutrition-logo-start" className="b-nutrition__wave" animated />
      <BrandEdge id="nutrition-logo-end" className="b-nutrition__wave b-nutrition__wave--end" animated />
      <div className="b-nutrition__layout">
        <header className="b-nutrition__head">
          <p className="b-kicker" data-reveal><b>۰۲</b>ارزش غذایی</p>
          <h2 id="nutrition-title">
            <span className="b-mask"><span data-line>روی برچسب</span></span>
            <span className="b-mask"><span data-line>چه نوشته؟</span></span>
          </h2>
          <p className="b-nutrition__intro" data-reveal>عددها و رنگ‌ها همان‌هایی‌اند که روی قوطی می‌بینی.</p>
          <p className="b-nutrition__serving" data-reveal><span>اندازهٔ وعده</span><strong>{nutrition.serving}</strong></p>
        </header>
        <figure className="b-facts" data-reveal>
          <figcaption id="nutrition-table-title">
            <span>در هر وعده</span>
            <small>{nutrition.serving}</small>
          </figcaption>
          <table aria-labelledby="nutrition-title nutrition-table-title">
            <tbody>
              {nutrition.rows.map((row) => (
                <tr key={row.name} data-level={row.level ?? undefined}>
                  <th scope="row">{row.level ? <i aria-hidden="true" /> : null}{row.name}</th>
                  <td><b>{row.value}</b><span>{row.unit}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="b-legend" aria-label="راهنمای رنگ">
            {nutrition.legend.map((item) => (
              <li key={item.level} data-level={item.level}><i aria-hidden="true" />{item.label}</li>
            ))}
          </ul>
        </figure>
      </div>
    </section>
  );
}

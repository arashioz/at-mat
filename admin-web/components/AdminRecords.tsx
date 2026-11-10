import type { ReactNode } from 'react';

export type AdminRecordColumn<Item> = {
  label: string;
  value: (item: Item) => ReactNode;
};

export function AdminRecords<Item extends { _id: string; name: string }>({ items, columns, label }: {
  items: readonly Item[];
  columns: readonly AdminRecordColumn<Item>[];
  label: string;
}) {
  return (
    <div className="admin-records">
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label={label}>
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">نام</th>
              {columns.map(column => <th scope="col" key={column.label}>{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <th scope="row">{item.name}</th>
                {columns.map(column => <td key={column.label}>{column.value(item)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="admin-records-list" role="list" aria-label={label}>
        {items.map(item => (
          <li key={item._id}>
            <strong>{item.name}</strong>
            <dl>
              {columns.map(column => (
                <div key={column.label}>
                  <dt>{column.label}</dt>
                  <dd>{column.value(item)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

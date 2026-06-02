import type {
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react'
import { cn } from './cn'

export type DataTableProps = HTMLAttributes<HTMLTableElement> & {
  children: ReactNode
}

export function DataTable({ className, children, ...props }: DataTableProps) {
  return (
    <div className="access-ds-table-wrap">
      <table className={cn('access-ds-table', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function DataTableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

export function DataTableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

export function DataTableRow({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>
}

export function DataTableHeaderCell({
  className,
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={className} {...props}>
      {children}
    </th>
  )
}

export function DataTableCell({
  className,
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={className} {...props}>
      {children}
    </td>
  )
}

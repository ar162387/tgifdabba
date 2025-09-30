import React, { memo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

// Optimized table components for real-time updates
const OptimizedTable = memo(({ children, className, ...props }) => (
  <div className={`bg-white rounded-lg shadow overflow-hidden ${className || ''}`}>
    <Table {...props}>
      {children}
    </Table>
  </div>
));

OptimizedTable.displayName = 'OptimizedTable';

const OptimizedTableHeader = memo(({ children, ...props }) => (
  <TableHeader {...props}>
    <TableRow>
      {children}
    </TableRow>
  </TableHeader>
));

OptimizedTableHeader.displayName = 'OptimizedTableHeader';

const OptimizedTableBody = memo(({ children, ...props }) => (
  <TableBody {...props}>
    {children}
  </TableBody>
));

OptimizedTableBody.displayName = 'OptimizedTableBody';

const OptimizedTableHead = memo(({ children, className, ...props }) => (
  <TableHead className={className} {...props}>
    {children}
  </TableHead>
));

OptimizedTableHead.displayName = 'OptimizedTableHead';

// Row component with enhanced memoization for real-time updates
const OptimizedTableRow = memo(({ 
  children, 
  className, 
  orderId, 
  status, 
  paymentStatus,
  selected,
  ...props 
}) => (
  <TableRow 
    className={className} 
    key={`${orderId}-${status}-${paymentStatus}`}
    selected={selected}
    {...props}
  >
    {children}
  </TableRow>
));

OptimizedTableRow.displayName = 'OptimizedTableRow';

const OptimizedTableCell = memo(({ children, className, ...props }) => (
  <TableCell className={className} {...props}>
    {children}
  </TableCell>
));

OptimizedTableCell.displayName = 'OptimizedTableCell';

export {
  OptimizedTable,
  OptimizedTableHeader,
  OptimizedTableBody,
  OptimizedTableHead,
  OptimizedTableRow,
  OptimizedTableCell
};

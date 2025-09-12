import React from 'react';
import { cn } from '../../../lib/utils';

const Skeleton = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
      {...props}
    />
  );
};

// Pre-built skeleton components
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="ml-4 flex-1">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
    <div className="mt-4">
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center">
      <Skeleton className="h-12 w-12 rounded-lg" />
      <div className="ml-4">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
    <div className="mt-4">
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const FormSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i}>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex justify-end space-x-3">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export default Skeleton;

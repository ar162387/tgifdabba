import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../../lib/utils';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showPageNumbers = true,
  maxVisiblePages = 5,
  className,
  ...props 
}) => {
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const pages = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);
    
    // Adjust if we're near the beginning or end
    if (endPage - startPage + 1 < maxVisiblePages) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push('ellipsis-start');
      }
    }
    
    // Add visible pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={cn("flex items-center justify-center space-x-1", className)} {...props}>
      {/* Previous Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 w-8 p-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page Numbers */}
      {showPageNumbers && (
        <>
          {visiblePages.map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <div key={`ellipsis-${index}`} className="flex items-center justify-center h-8 w-8">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }
            
            return (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className="h-8 w-8 p-0"
              >
                {page}
              </Button>
            );
          })}
        </>
      )}

      {/* Next Button */}
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 w-8 p-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Pagination Info Component
const PaginationInfo = ({ 
  currentPage, 
  totalPages, 
  totalItems, 
  itemsPerPage,
  className,
  ...props 
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn("text-sm text-gray-600", className)} {...props}>
      Showing {startItem} to {endItem} of {totalItems} results
    </div>
  );
};

// Pagination Size Selector
const PaginationSizeSelector = ({ 
  itemsPerPage, 
  onItemsPerPageChange, 
  options = [10, 25, 50, 100],
  className,
  ...props 
}) => {
  return (
    <div className={cn("flex items-center space-x-2", className)} {...props}>
      <span className="text-sm text-gray-600">Show:</span>
      <select
        value={itemsPerPage}
        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-600">per page</span>
    </div>
  );
};

export { Pagination, PaginationInfo, PaginationSizeSelector };

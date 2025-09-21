import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Eye, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import { useContacts, useMarkContactAsRead, useDeleteContact } from '../hooks/useContacts';
import toast from 'react-hot-toast';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedContact, setSelectedContact] = useState(null);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);

  // Simple query parameters without search
  const queryParams = useMemo(() => ({
    page: 1,
    limit: 1000, // Get all contacts for client-side filtering
    sortBy,
    sortOrder
  }), [sortBy, sortOrder]);

  // TanStack Query hooks
  const { data: contactsData, isLoading, error } = useContacts(queryParams);
  const markAsReadMutation = useMarkContactAsRead();
  const deleteMutation = useDeleteContact();

  // Update allContacts when data changes
  useEffect(() => {
    if (contactsData?.contacts) {
      setAllContacts(contactsData.contacts);
    }
  }, [contactsData?.contacts]);

  // Client-side filtering - no re-renders that affect input focus
  useEffect(() => {
    let filtered = allContacts;
    
    // Apply read filter first
    if (readFilter) {
      filtered = filtered.filter(contact => contact.read.toString() === readFilter);
    }
    
    // Then apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(searchLower) ||
        contact.message.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredContacts(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [allContacts, searchTerm, readFilter]);

  // Memoized contacts and pagination data
  const contacts = useMemo(() => filteredContacts, [filteredContacts]);
  const totalPages = useMemo(() => Math.ceil(filteredContacts.length / itemsPerPage), [filteredContacts.length, itemsPerPage]);

  // Ensure current page is valid when filtered contacts change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Debug logging
  console.log('Contacts pagination debug:', {
    allContactsLength: allContacts.length,
    filteredContactsLength: filteredContacts.length,
    currentPage,
    itemsPerPage,
    totalPages,
    contactsLength: contacts.length,
    slicedContactsLength: contacts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).length
  });

  // Memoized event handlers
  const handleMarkAsRead = useCallback(async (contactId) => {
    try {
      await markAsReadMutation.mutateAsync(contactId);
      toast.success('Contact marked as read');
    } catch (error) {
      toast.error('Failed to mark contact as read');
    }
  }, [markAsReadMutation]);

  const handleDelete = useCallback(async (contactId) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteMutation.mutateAsync(contactId);
        toast.success('Contact deleted successfully');
      } catch (error) {
        toast.error('Failed to delete contact');
      }
    }
  }, [deleteMutation]);

  // Memoized utility functions
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Simple filter handlers - no useCallback to avoid re-render issues
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleReadFilterChange = (e) => {
    setReadFilter(e.target.value);
  };

  // Pagination handlers
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  }, []);

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <FormSkeleton />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <TableSkeleton rows={8} columns={6} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load contacts</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
          />
          
          <select
            value={readFilter}
            onChange={handleReadFilterChange}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Messages</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {contacts.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((contact) => (
                  <ContactTableRow
                    key={contact._id}
                    contact={contact}
                    formatDate={formatDate}
                    onViewDetails={() => setSelectedContact(contact)}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                  />
                ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          type="contacts"
          title="No contacts found"
          description="Contact messages will appear here when customers reach out."
        />
      )}

      {/* Pagination */}
      {contacts.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          {/* Pagination Info */}
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, contacts.length)} of {contacts.length} results
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Size Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="h-8 w-8 p-0"
                >
                  ←
                </Button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="h-8 w-8 p-0"
                >
                  →
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Details Modal */}
      {selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onMarkAsRead={handleMarkAsRead}
        />
      )}
    </div>
  );
};

// Contact Details Modal Component
const ContactDetailsModal = ({ contact, onClose, onMarkAsRead }) => {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-transparent backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Contact Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="text-lg font-medium mb-3">Contact Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{contact.name}</p>
                  </div>
                  {contact.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{contact.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {new Date(contact.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>


            {/* Message */}
            <div>
              <h3 className="text-lg font-medium mb-3">Message</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>

            {/* Response */}
            {contact.response && (
              <div>
                <h3 className="text-lg font-medium mb-3">Response</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{contact.response}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            {!contact.read && (
              <Button variant="outline" onClick={() => onMarkAsRead(contact._id)}>
                Mark as Read
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoized Contact Table Row Component
const ContactTableRow = React.memo(({ 
  contact, 
  formatDate, 
  onViewDetails, 
  onMarkAsRead, 
  onDelete 
}) => {
  return (
    <TableRow className={!contact.read ? 'bg-blue-50' : ''}>
      <TableCell className="font-medium">{contact.name}</TableCell>
      <TableCell>{contact.phone || 'No phone'}</TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          {contact.read ? (
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Read
            </span>
          ) : (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              Unread
            </span>
          )}
          {contact.responded && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Responded
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">
        {formatDate(contact.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <button
            onClick={onViewDetails}
            className="text-blue-600 hover:text-blue-800"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          {!contact.read && (
            <button
              onClick={() => onMarkAsRead(contact._id)}
              className="text-green-600 hover:text-green-800"
              title="Mark as Read"
            >
              <CheckCircle size={16} />
            </button>
          )}
          <button
            onClick={() => onDelete(contact._id)}
            className="text-red-600 hover:text-red-800"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
});

// Simple search input - no complex focus management
const SearchInput = ({ value, onChange }) => {
  return (
    <div className="relative">
      <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search contacts..."
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
};

export default Contacts;

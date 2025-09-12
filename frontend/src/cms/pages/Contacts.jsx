import React, { useState, useMemo, useCallback, useTransition } from 'react';
import { Search, Filter, Eye, Mail, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { TableSkeleton, FormSkeleton } from '../components/ui/Skeleton';
import { useContacts, useMarkContactAsRead, useRespondToContact, useDeleteContact } from '../hooks/useContacts';
import { useDebounce } from '../hooks/useDebounce';
import toast from 'react-hot-toast';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized query parameters
  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: 10,
    ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
    ...(readFilter && { read: readFilter }),
    sortBy,
    sortOrder
  }), [currentPage, debouncedSearchTerm, readFilter, sortBy, sortOrder]);

  // TanStack Query hooks
  const { data: contactsData, isLoading, error } = useContacts(queryParams);
  const markAsReadMutation = useMarkContactAsRead();
  const respondMutation = useRespondToContact();
  const deleteMutation = useDeleteContact();

  // Memoized contacts and pagination data
  const contacts = useMemo(() => contactsData?.contacts || [], [contactsData?.contacts]);
  const totalPages = useMemo(() => contactsData?.pagination?.pages || 1, [contactsData?.pagination?.pages]);

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

  // Memoized filter handlers with useTransition
  const handleSearchChange = useCallback((e) => {
    startTransition(() => {
      setSearchTerm(e.target.value);
    });
  }, []);

  const handleReadFilterChange = useCallback((e) => {
    startTransition(() => {
      setReadFilter(e.target.value);
    });
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          
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
          
          <Button variant="outline" disabled={isPending}>
            <Filter size={20} className="mr-2" />
            {isPending ? 'Filtering...' : 'Apply Filters'}
          </Button>
        </div>
      </div>

      {/* Table */}
      {contacts.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
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
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
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
  const [response, setResponse] = useState('');
  const respondMutation = useRespondToContact();

  const handleRespond = async () => {
    if (!response.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      await respondMutation.mutateAsync({
        id: contact._id,
        response: response
      });
      toast.success('Response added successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900 bg-opacity-20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Details</h2>

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
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{contact.email}</p>
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

            {/* Subject */}
            {contact.subject && (
              <div>
                <h3 className="text-lg font-medium mb-3">Subject</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{contact.subject}</p>
                </div>
              </div>
            )}

            {/* Message */}
            <div>
              <h3 className="text-lg font-medium mb-3">Message</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{contact.message}</p>
              </div>
            </div>

            {/* Response */}
            {contact.response ? (
              <div>
                <h3 className="text-lg font-medium mb-3">Response</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{contact.response}</p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-3">Add Response</h3>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={4}
                  placeholder="Type your response here..."
                />
                <div className="mt-3">
                  <Button onClick={handleRespond} disabled={isResponding}>
                    {isResponding ? 'Sending...' : 'Send Response'}
                  </Button>
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
      <TableCell>{contact.email}</TableCell>
      <TableCell>
        <div className="max-w-xs truncate">
          {contact.subject || 'No subject'}
        </div>
      </TableCell>
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

export default Contacts;

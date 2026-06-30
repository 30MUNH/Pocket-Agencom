import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../api/bookingApi';

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: bookingApi.list,
  });
}

export function useBooking(id) {
  return useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => bookingApi.updateStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  });
}

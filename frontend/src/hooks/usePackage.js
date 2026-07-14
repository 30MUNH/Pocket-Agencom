import { useQuery } from '@tanstack/react-query';
import { packageApi } from '../api/packageApi';

export function usePackage(id) {
  return useQuery({
    queryKey: ['packages', id],
    queryFn: () => packageApi.getById(id),
    enabled: !!id,
  });
}

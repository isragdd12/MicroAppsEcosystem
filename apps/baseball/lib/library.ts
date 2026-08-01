import { useQuery } from '@tanstack/react-query';

import { listDrills, listLingo, listWorkouts } from './api';

export function useWorkouts() {
  return useQuery({ queryKey: ['library-workouts'], queryFn: listWorkouts });
}

export function useDrills() {
  return useQuery({ queryKey: ['library-drills'], queryFn: listDrills });
}

export function useLingo() {
  return useQuery({ queryKey: ['library-lingo'], queryFn: listLingo });
}

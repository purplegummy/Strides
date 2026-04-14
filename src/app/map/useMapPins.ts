"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import type { PinData } from "~/app/_components/pin/PinMarker";
import type { ExploredPoint } from "./map-utils";
 
export function useMapPins(
  position: ExploredPoint | null,
  lastKnownPosition: ExploredPoint | null,
  onPinCreated?: (pin: { lat: number; lng: number }) => void,
) {
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [editingPin, setEditingPin] = useState<PinData | null>(null);
 
  const utils = api.useUtils();
 
  const pinsQuery = api.pin.getAll.useQuery(undefined, {
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
 
  const createPin = api.pin.create.useMutation({
    onSuccess: (createdPin) => {
      void utils.pin.getAll.invalidate();
      setCreateSheetOpen(false);
      if (onPinCreated) {
        onPinCreated({ lat: createdPin.lat, lng: createdPin.lng });
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
 
  const updatePin = api.pin.update.useMutation({
    onSuccess: () => {
      void utils.pin.getAll.invalidate();
      setEditingPin(null);
      setCreateSheetOpen(false);
      setSelectedPin(null);
    },
  });
 
  const upvotePin = api.pin.upvote.useMutation({
    onSuccess: () => void utils.pin.getAll.invalidate(),
  });
 
  const undoUpvote = api.pin.undoUpvote.useMutation({
    onSuccess: () => void utils.pin.getAll.invalidate(),
  });
 
  const deletePin = api.pin.delete.useMutation({
    onSuccess: () => {
      void utils.pin.getAll.invalidate();
      setSelectedPin(null);
    },
  });
 
  const handleDropPin = useCallback(() => {
    if (!position && !lastKnownPosition) return;
    setEditingPin(null);
    setCreateSheetOpen(true);
  }, [position, lastKnownPosition]);
 
  const handleCreateSubmit = useCallback(
    (data: { title: string; description: string }) => {
      const loc = position ?? lastKnownPosition;
      if (!loc) return;
      if (editingPin) {
        updatePin.mutate({ id: editingPin.id, ...data });
      } else {
        createPin.mutate({ ...data, lat: loc.lat, lng: loc.lng });
      }
    },
    [position, lastKnownPosition, editingPin, createPin, updatePin],
  );
 
  const handleEditPin = useCallback((pin: PinData) => {
    setEditingPin(pin);
    setSelectedPin(null);
    setCreateSheetOpen(true);
  }, []);
 
  const closeCreateSheet = useCallback(() => {
    setCreateSheetOpen(false);
    setEditingPin(null);
  }, []);
 
  return {
    selectedPin,
    setSelectedPin,
    createSheetOpen,
    editingPin,
    pinsQuery,
    createPin,
    updatePin,
    upvotePin,
    undoUpvote,
    deletePin,
    handleDropPin,
    handleCreateSubmit,
    handleEditPin,
    closeCreateSheet,
  };
}
 
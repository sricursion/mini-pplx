import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from '../useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing toasts
    act(() => {
      const { dismiss } = renderHook(() => useToast()).result.current;
      dismiss();
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test Description',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Test Toast',
      description: 'Test Description',
      open: true,
    });
  });

  it('should add toast with different variants', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({
        title: 'Error Toast',
        variant: 'destructive',
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Error Toast',
      variant: 'destructive',
    });
  });

  it('should dismiss a specific toast', () => {
    const { result } = renderHook(() => useToast());
    
    let toastId: string;
    
    act(() => {
      const toastResult = result.current.toast({
        title: 'Test Toast',
      });
      toastId = toastResult.id;
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it('should dismiss all toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    expect(result.current.toasts).toHaveLength(2);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts.every(toast => !toast.open)).toBe(true);
  });

  it('should limit number of toasts', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' });
    });

    // Should only keep the most recent toast (TOAST_LIMIT = 1)
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Toast 2');
  });

  it('should update a toast', () => {
    const { result } = renderHook(() => useToast());
    
    let updateFn: (props: any) => void;
    
    act(() => {
      const toastResult = result.current.toast({
        title: 'Original Title',
      });
      updateFn = toastResult.update;
    });

    act(() => {
      updateFn({
        title: 'Updated Title',
        description: 'New Description',
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Updated Title',
      description: 'New Description',
    });
  });

  it('should handle toast with action', () => {
    const { result } = renderHook(() => useToast());
    const mockAction = vi.fn();
    
    act(() => {
      result.current.toast({
        title: 'Toast with Action',
        action: mockAction as any,
      });
    });

    expect(result.current.toasts[0]).toMatchObject({
      title: 'Toast with Action',
      action: mockAction,
    });
  });
});

describe('toast function', () => {
  it('should create toast using standalone function', () => {
    const { result } = renderHook(() => useToast());
    
    act(() => {
      toast({
        title: 'Standalone Toast',
        description: 'Created with toast function',
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      title: 'Standalone Toast',
      description: 'Created with toast function',
    });
  });

  it('should return toast control functions', () => {
    let toastResult: any;
    
    act(() => {
      toastResult = toast({
        title: 'Controllable Toast',
      });
    });

    expect(toastResult).toHaveProperty('id');
    expect(toastResult).toHaveProperty('dismiss');
    expect(toastResult).toHaveProperty('update');
    expect(typeof toastResult.dismiss).toBe('function');
    expect(typeof toastResult.update).toBe('function');
  });

  it('should dismiss toast using returned function', () => {
    const { result } = renderHook(() => useToast());
    let dismissFn: () => void;
    
    act(() => {
      const toastResult = toast({
        title: 'Dismissible Toast',
      });
      dismissFn = toastResult.dismiss;
    });

    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      dismissFn();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});
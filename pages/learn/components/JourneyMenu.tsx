import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import {
  Globe,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';

import {
  deleteCourse,
  emitJourneyChange,
  renameCourse,
} from '../../../lib/courseActions';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface JourneyMenuProps {
  journey: { id: string; title: string };
  /** Positioning / visibility classes from the parent (e.g. hover reveal). */
  buttonClassName?: string;
  /**
   * Called when "Publish to Explore" is chosen. When omitted (e.g. in the
   * sidebar) the menu opens the journey page with the publish screen showing.
   */
  onPublish?: () => void;
}

type DialogKind = 'rename' | 'delete';

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const MENU_WIDTH = 224;
const MENU_HEIGHT_ESTIMATE = 220;

const triggerClasses =
  'flex h-8 w-8 pointer-coarse:h-11 pointer-coarse:w-11 shrink-0 items-center justify-center rounded-lg text-[#91A4AC] transition-colors hover:bg-[#2A3D45] hover:text-white aria-expanded:bg-[#2A3D45] aria-expanded:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

const menuItemClasses =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange';

const secondaryButtonClasses =
  'min-h-[46px] rounded-2xl border border-[#344951] bg-[#1D3037] px-5 text-sm font-extrabold text-[#D7E0E3] transition-colors hover:bg-[#24383F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange disabled:pointer-events-none disabled:opacity-50';

const primaryButtonClasses =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-orange px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#C94713] transition-all hover:brightness-105 active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-[#19272D] disabled:pointer-events-none disabled:opacity-50';

const destructiveButtonClasses =
  'inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 text-sm font-extrabold text-white shadow-[0_4px_0_#B91C1C] transition-all hover:brightness-105 active:translate-y-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#19272D] disabled:pointer-events-none disabled:opacity-60';

// -----------------------------------------------------------------------------
// Modal pieces
// -----------------------------------------------------------------------------

function ModalFrame({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <div className="w-full max-w-[420px] rounded-[26px] border border-[#34434A] bg-[#19272D] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:p-7">
        {children}
      </div>
    </div>,
    document.body,
  );
}

function RenameDialog({
  currentTitle,
  onSubmit,
  onClose,
}: {
  currentTitle: string;
  onSubmit: (title: string) => Promise<void>;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const canSave =
    trimmed.length > 0 && trimmed !== currentTitle.trim() && !busy;

  const handleSubmit = async (event: SyntheticEvent) => {
    event.preventDefault();

    if (!canSave) return;

    setBusy(true);
    setError(null);

    try {
      await onSubmit(trimmed);
    } catch (submitError) {
      console.error('Failed to rename journey', submitError);
      setError('We couldn’t rename this journey. Please try again.');
      setBusy(false);
    }
  };

  return (
    <ModalFrame
      labelledBy="rename-journey-title"
      onClose={busy ? () => undefined : onClose}
    >
      <form onSubmit={handleSubmit}>
        <h2
          id="rename-journey-title"
          className="font-display text-2xl font-extrabold tracking-[-0.02em] text-white"
        >
          Edit name
        </h2>

        <label
          htmlFor="rename-journey-input"
          className="mt-5 block text-sm font-semibold text-[#91A4AC]"
        >
          Journey name
        </label>

        <input
          id="rename-journey-input"
          type="text"
          autoFocus
          maxLength={80}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          disabled={busy}
          className="mt-2 w-full rounded-2xl border border-[#344951] bg-[#131F24] px-4 py-3 text-base font-semibold text-white outline-none transition-colors placeholder:text-[#60757E] focus:border-orange disabled:opacity-60"
        />

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200"
          >
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={secondaryButtonClasses}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!canSave}
            className={primaryButtonClasses}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save name'
            )}
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

function ConfirmDialog({
  id,
  title,
  description,
  confirmLabel,
  busyLabel,
  destructive = false,
  errorMessage,
  onConfirm,
  onClose,
}: {
  id: string;
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  destructive?: boolean;
  errorMessage: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      await onConfirm();
    } catch (confirmError) {
      console.error(`Journey action failed: ${confirmLabel}`, confirmError);
      setError(errorMessage);
      setBusy(false);
    }
  };

  return (
    <ModalFrame
      labelledBy={id}
      onClose={busy ? () => undefined : onClose}
    >
      <h2
        id={id}
        className="font-display text-2xl font-extrabold tracking-[-0.02em] text-white"
      >
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-[#91A4AC]">{description}</p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-xs font-medium text-red-200"
        >
          {error}
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          autoFocus
          onClick={onClose}
          disabled={busy}
          className={secondaryButtonClasses}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className={destructive ? destructiveButtonClasses : primaryButtonClasses}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {busyLabel}
            </>
          ) : (
            confirmLabel
          )}
        </button>
      </div>
    </ModalFrame>
  );
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export default function JourneyMenu({
  journey,
  buttonClassName = '',
  onPublish,
}: JourneyMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback((returnFocus = false) => {
    setOpen(false);

    if (returnFocus) buttonRef.current?.focus();
  }, []);

  const toggleMenu = () => {
    if (open) {
      closeMenu();
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();

    if (!rect) return;

    // Right-align to the button, clamp inside the viewport, and flip upward
    // when there isn't enough room below.
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8,
    );

    const below = rect.bottom + 6;
    const top =
      below + MENU_HEIGHT_ESTIMATE > window.innerHeight
        ? Math.max(8, rect.top - 6 - MENU_HEIGHT_ESTIMATE)
        : below;

    setPosition({ top, left });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu(true);
    };

    const handleDismiss = () => setOpen(false);

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
    };
  }, [open, closeMenu]);

  const openDialog = (kind: DialogKind) => {
    setOpen(false);
    setDialog(kind);
  };

  const handlePublishClick = () => {
    setOpen(false);

    if (onPublish) {
      onPublish();
      return;
    }

    navigate(`/learn/course/${journey.id}`, { state: { openPublish: true } });
  };

  const closeDialog = () => {
    setDialog(null);
    buttonRef.current?.focus();
  };

  const handleRename = async (title: string) => {
    await renameCourse(journey.id, title);
    emitJourneyChange({ id: journey.id, action: 'rename', title });
    setDialog(null);
  };

  const handleDelete = async () => {
    await deleteCourse(journey.id);
    emitJourneyChange({ id: journey.id, action: 'delete' });
    setDialog(null);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-label={`Options for ${journey.title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`${triggerClasses} ${buttonClassName}`}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
            className="fixed z-[90] rounded-[20px] border border-[#39464C] bg-[#202F35]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => openDialog('rename')}
              className={`${menuItemClasses} text-[#E6EAEC] hover:bg-white/[0.07]`}
            >
              <Pencil className="h-[18px] w-[18px] text-[#C5CFD3]" aria-hidden="true" />
              Edit name
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handlePublishClick}
              className={`${menuItemClasses} text-[#E6EAEC] hover:bg-white/[0.07]`}
            >
              <Globe className="h-[18px] w-[18px] text-[#C5CFD3]" aria-hidden="true" />
              Publish to Explore
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => openDialog('delete')}
              className={`${menuItemClasses} text-red-300 hover:bg-red-400/10`}
            >
              <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
              Delete journey
            </button>
          </div>,
          document.body,
        )}

      {dialog === 'rename' && (
        <RenameDialog
          currentTitle={journey.title}
          onSubmit={handleRename}
          onClose={closeDialog}
        />
      )}

      {dialog === 'delete' && (
        <ConfirmDialog
          id="delete-journey-title"
          title="Delete this journey?"
          description="This permanently removes the journey, its zones, lessons and your progress. This can’t be undone."
          confirmLabel="Delete journey"
          busyLabel="Deleting..."
          destructive
          errorMessage="We couldn’t delete this journey. Please try again."
          onConfirm={handleDelete}
          onClose={closeDialog}
        />
      )}
    </>
  );
}
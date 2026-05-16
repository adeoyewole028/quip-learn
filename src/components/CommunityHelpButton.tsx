import type { ComponentProps } from 'react';
import { CircleHelp, LifeBuoy } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface CommunityHelpButtonProps {
  className?: string;
  size?: ComponentProps<typeof Button>['size'];
}

export function CommunityHelpButton({ className, size = 'sm' }: CommunityHelpButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="outline" size={size} className={className} aria-label="Open community help" />}
      >
        <CircleHelp className="h-4 w-4" />
        Help
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-primary/10 text-primary">
            <LifeBuoy className="h-5 w-5" />
          </AlertDialogMedia>
          <AlertDialogTitle>Community help</AlertDialogTitle>
          <AlertDialogDescription>
            Use the community to ask practical questions, compare answers from peers, and keep discussions easy to scan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 text-sm leading-6 text-muted-foreground">
          <p>Start with a short title, add enough detail for someone else to understand the issue, and use tags to reach the right team.</p>
          <p>Reply inside a thread when you have a concrete answer or a field-tested workaround to share.</p>
          <p>Admin and moderator accounts can approve, edit, and delete posts from inside each discussion thread.</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DeleteAccountSection() {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.functions.invoke("deleteMyAccount", {});
      await base44.auth.logout("/login");
    } catch (e) {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-background rounded-2xl p-5 border border-destructive/30 shadow-sm mb-5">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        <h2 className="font-bold text-destructive">Delete Account</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Permanently delete your account and associated data. This action cannot be undone.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="h-11 font-semibold">
            <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account and associated data. You will be signed out immediately. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</> : "Delete Forever"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
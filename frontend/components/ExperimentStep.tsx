"use client";

import { useState } from 'react';
import { Lock, Unlock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface ExperimentStepProps {
  id: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  onToggleEncryption: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, title: string, content: string) => void;
}

export function ExperimentStep({
  id,
  title,
  content,
  isEncrypted,
  onToggleEncryption,
  onDelete,
  onUpdate,
}: ExperimentStepProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);

  const handleSave = () => {
    onUpdate(id, editTitle, editContent);
    setIsEditing(false);
  };

  const encryptedContent = '••••••••••••••••••••••••••••••••';
  const displayContent = isEncrypted ? encryptedContent : content;
  const displayTitle = isEncrypted ? `🔒 ${title}` : title;

  return (
    <Card className="p-4 hover:shadow-md transition-all duration-300 bg-card">
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg transition-colors ${
            isEncrypted
              ? 'bg-gradient-to-br from-encrypted/20 to-encrypted/10 text-encrypted'
              : 'bg-gradient-to-br from-lab-blue/20 to-lab-teal/10 text-lab-blue'
          }`}
        >
          {isEncrypted ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Step title"
                className="font-medium"
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Step details, data, parameters..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} size="sm" variant="default">
                  Save
                </Button>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(title);
                    setEditContent(content);
                  }}
                  size="sm"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                {displayTitle}
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {displayContent}
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {!isEditing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Edit</span>
                ✏️
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleEncryption(id)}
                className="h-8 w-8 p-0"
                title={isEncrypted ? "Decrypt (requires signature)" : "Encrypt (requires signature)"}
              >
                <span className="sr-only">Toggle encryption</span>
                {isEncrypted ? '🔓' : '🔒'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

"use client";

import { Topic } from "@/lib/hooks/useTopics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function TopicSettingsTab({ topic }: { topic: Topic }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Basic configuration for the topic.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Topic Name</Label>
            <Input value={topic.name} disabled />
            <p className="text-xs text-muted-foreground">
              Topic names cannot be changed after creation.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Partitions</Label>
              <Input value={topic.partitions} disabled />
              <p className="text-xs text-muted-foreground">
                Horizontal scaling units.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Retention Period</Label>
              <Input
                value={`${Math.floor(Number(topic.retentionMs) / 86400000)} days`}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                How long messages are stored.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for this topic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-destructive">Delete Topic</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this topic and all its data.
              </p>
            </div>
            <Button variant="destructive">Delete Topic</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

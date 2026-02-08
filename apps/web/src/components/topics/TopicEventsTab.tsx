"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { socketService } from "@/lib/socket";
import { Play, Pause, Trash2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";

interface TopicEvent {
  id: string;
  topicId: string;
  event: {
    id: string;
    topic: string;
    partition: number;
    offset: string;
    payload: any;
    timestamp: string;
  };
  timestamp: string;
}

export function TopicEventsTab({ topicId }: { topicId: string }) {
  const [events, setEvents] = useState<TopicEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = socketService.connect();

    function onConnect() {
      setIsConnected(true);
      socketService.subscribe(topicId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onEvent(data: TopicEvent) {
      if (!isPaused) {
        setEvents((prev) => [data, ...prev].slice(0, 50)); // Keep last 50 events
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("event", onEvent);

    // Initial connection check
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socketService.unsubscribe(topicId);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("event", onEvent);
    };
  }, [topicId, isPaused]);

  const filteredEvents = events.filter((e) =>
    JSON.stringify(e.event.payload)
      .toLowerCase()
      .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search payload..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={isConnected ? "success" : "destructive"}
            className="h-9"
          >
            {isConnected ? "Live" : "Disconnected"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
            className={
              isPaused
                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                : ""
            }
          >
            {isPaused ? (
              <Play className="mr-2 h-4 w-4" />
            ) : (
              <Pause className="mr-2 h-4 w-4" />
            )}
            {isPaused ? "Resume" : "Pause"}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setEvents([])}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              No events received yet. Publish an event to see it appear here
              live.
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => (
            <Card
              key={event.event.id}
              className="overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-start border-l-4 border-primary bg-card/50 p-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono">
                        Partition {event.event.partition}
                      </Badge>
                      <Badge variant="secondary" className="font-mono">
                        Offset {event.event.offset}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(event.event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <pre className="mt-3 rounded-lg bg-muted/50 p-3 text-sm font-mono overflow-x-auto">
                    {JSON.stringify(event.event.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

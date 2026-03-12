import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JobProgress } from '@/common/interfaces/job.interface';

@WebSocketGateway({
  cors: {
    origin: (process.env.WS_CORS_ORIGIN || 'http://localhost:5173').includes(',')
      ? (process.env.WS_CORS_ORIGIN || '').split(',').map(o => o.trim())
      : process.env.WS_CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/progress',
})
export class ProgressGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ProgressGateway.name);
  private readonly jobSubscriptions = new Map<string, Set<string>>(); // jobId -> Set of socketIds

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    // Remove client from all job subscriptions
    for (const [jobId, subscribers] of this.jobSubscriptions.entries()) {
      subscribers.delete(client.id);
      if (subscribers.size === 0) {
        this.jobSubscriptions.delete(jobId);
      }
    }
  }

  @SubscribeMessage('subscribe-to-job')
  handleSubscribeToJob(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { jobId } = data;
    
    if (!this.jobSubscriptions.has(jobId)) {
      this.jobSubscriptions.set(jobId, new Set());
    }
    
    this.jobSubscriptions.get(jobId).add(client.id);
    
    this.logger.log(`Client ${client.id} subscribed to job ${jobId}`);
    
    // Send acknowledgment
    client.emit('subscription-confirmed', { jobId });
  }

  @SubscribeMessage('unsubscribe-from-job')
  handleUnsubscribeFromJob(
    @MessageBody() data: { jobId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { jobId } = data;
    
    if (this.jobSubscriptions.has(jobId)) {
      this.jobSubscriptions.get(jobId).delete(client.id);
      
      if (this.jobSubscriptions.get(jobId).size === 0) {
        this.jobSubscriptions.delete(jobId);
      }
    }
    
    this.logger.log(`Client ${client.id} unsubscribed from job ${jobId}`);
    
    // Send acknowledgment
    client.emit('unsubscription-confirmed', { jobId });
  }

  // Method to send progress updates to subscribed clients
  sendProgressUpdate(jobId: string, progress: JobProgress) {
    const subscribers = this.jobSubscriptions.get(jobId);
    
    if (subscribers && subscribers.size > 0) {
      const sockets = Array.from(subscribers)
        .map(socketId => this.server.sockets.get(socketId))
        .filter(socket => socket !== undefined);
      
      for (const socket of sockets) {
        socket.emit('progress-update', {
          jobId,
          progress,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.logger.debug(`Sent progress update for job ${jobId} to ${sockets.length} clients`);
    }
  }

  // Method to send completion notification
  sendJobCompletion(jobId: string, result: any) {
    const subscribers = this.jobSubscriptions.get(jobId);
    
    if (subscribers && subscribers.size > 0) {
      const sockets = Array.from(subscribers)
        .map(socketId => this.server.sockets.get(socketId))
        .filter(socket => socket !== undefined);
      
      for (const socket of sockets) {
        socket.emit('job-completed', {
          jobId,
          result,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.logger.log(`Sent completion notification for job ${jobId} to ${sockets.length} clients`);
    }
  }

  // Method to send error notification
  sendJobError(jobId: string, error: string) {
    const subscribers = this.jobSubscriptions.get(jobId);
    
    if (subscribers && subscribers.size > 0) {
      const sockets = Array.from(subscribers)
        .map(socketId => this.server.sockets.get(socketId))
        .filter(socket => socket !== undefined);
      
      for (const socket of sockets) {
        socket.emit('job-error', {
          jobId,
          error,
          timestamp: new Date().toISOString(),
        });
      }
      
      this.logger.error(`Sent error notification for job ${jobId} to ${sockets.length} clients: ${error}`);
    }
  }

  // Get subscription stats
  getSubscriptionStats() {
    const stats = {
      totalJobs: this.jobSubscriptions.size,
      totalSubscribers: 0,
      jobDetails: {} as Record<string, number>,
    };

    for (const [jobId, subscribers] of this.jobSubscriptions.entries()) {
      stats.totalSubscribers += subscribers.size;
      stats.jobDetails[jobId] = subscribers.size;
    }

    return stats;
  }
}

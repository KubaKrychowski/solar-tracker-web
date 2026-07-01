import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SignalrService {
  private connections = new Map<string, signalR.HubConnection>();

  connect(hubName: string): signalR.HubConnection {
    const existing = this.connections.get(hubName);
    if (existing) return existing;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.hubUrl}/${hubName}`)
      .withAutomaticReconnect()
      .build();

    connection.start().catch(err => console.error(`SignalR ${hubName} error:`, err));
    this.connections.set(hubName, connection);
    return connection;
  }

  disconnect(hubName: string): void {
    const connection = this.connections.get(hubName);
    if (connection) {
      connection.stop();
      this.connections.delete(hubName);
    }
  }
}

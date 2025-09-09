declare module 'dockerode' {
  import { Readable } from 'stream';

  class Docker {
    constructor(options?: any);
    
    listContainers(options?: any): Promise<any[]>;
    getContainer(id: string): Docker.Container;
    createContainer(options: any): Promise<Docker.Container>;
    
    static Container: typeof Docker.Container;
  }

  namespace Docker {
    class Container {
      constructor(modem: any, id: string);
      
      id: string;
      inspect(): Promise<any>;
      start(options?: any): Promise<any>;
      stop(options?: any): Promise<any>;
      restart(options?: any): Promise<any>;
      pause(options?: any): Promise<any>;
      unpause(options?: any): Promise<any>;
      kill(options?: any): Promise<any>;
      remove(options?: any): Promise<any>;
      stats(options?: any): Readable;
      logs(options?: any): Promise<any>;
    }
  }

  export = Docker;
}

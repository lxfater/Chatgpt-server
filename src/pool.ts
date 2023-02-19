import { ChatGPTAPIBrowser, SendMessageOptions } from "chatgpt";
import accounts from "./accounts.js";
import PQueue from 'p-queue';
import pWaitFor from 'p-wait-for';
import { v4 as uuidv4 } from 'uuid';
interface Account {
    email: string;
    password: string;
}
interface Work {
    free: boolean;
    worker: ChatGPTAPIBrowser;
}
export class Pool {
    accounts:Work[] = []
    queue = new PQueue({concurrency: 10});
    async start() {
        this.accounts = []
        for await (const account of accounts) {
            const api = new ChatGPTAPIBrowser(account);
            await api.initSession()
            this.accounts.push({
                free: true,
                worker:api
            })
        }
    }
    loadAccounts() {
        return accounts;
    }
    async sendMessage(text: string) {
        let taskId = uuidv4();
        this.queue.add(async () => {
            await pWaitFor(() => {
                return this.accounts.findIndex((account) => account.free) !== -1
            }, {interval: 1000});
            try {
                let work = this.accounts.find((account) => account.free) as Work
                work.free = false;
                let reply = await work.worker.sendMessage(text);
                work.free = true;
                return {
                    message: reply,
                    taskId
                }
            } catch (error) {
                console.error(error)
                return {
                    message: 'error',
                    taskId
                }
            }

        })

        return new Promise<string>((resolve, reject) => {
            this.queue.on('completed', result => {
                let handle = setTimeout(() => {
                    reject('timeout')
                }, 5* 1000)
                if(result.taskId === taskId) {
                    resolve(result.message)
                    clearTimeout(handle)
                }
            });
        })

    }
}
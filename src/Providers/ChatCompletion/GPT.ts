import axios from 'axios';
import { IMessage } from '../../interfaces/IMessage';
import { createProxyConfig } from '../../util/util';
import { handleStream } from '../../util/stream';
import { IChatCompletionOptions } from '../../interfaces/IChatCompletionOptions';

class GPT {
    name: string;
    type: string;
    url: string;
    default_model: string;
    supports_message_history: boolean;
    need_slice_text: boolean;
    working: boolean;

    constructor() {
        this.name = "GPT",
        this.type = "ChatCompletion";
        this.default_model = "gpt-4",
        this.url = "https://nexra.aryahcr.cc/api/chat/gpt";        
        this.supports_message_history = true;
        this.need_slice_text = true;
        this.working = true;
    }

    /**
     * Asynchronously generates a chat response based on input messages.
     * @param {Array} messages - An array of messages for the chat.
     * @param {IChatCompletionOptions} options - Options for chat generation (optional).
     * @returns {Promise<object>} - A promise that resolves with the generated chat result as a object
     * @throws {Error} - Throws an error if fetching data fails.
     */
    async fetchData(messages:IMessage[], options:IChatCompletionOptions): Promise<object> {
        const headers = {
            'Content-Type': 'application/json'
        }
          
        const requestData = {
            messages,
            "prompt": messages[messages.length - 1].content,
            model: options?.model || "GPT-4",
            markdown: options?.markdown || false
        };
        
        // Init conversation session
        const initRequest = await axios.post(this.url, requestData, {
            headers: headers, proxy: createProxyConfig(options?.proxy),
            responseType: options?.stream ? 'stream' : 'text'
        })

        // Start conversation generating data with session id
        let id = JSON.parse(initRequest.data).id;
        let response = null;
        let data = true;
        while(data){
            response = await axios.get('https://nexra.aryahcr.cc/api/chat/task/' + encodeURIComponent(id));
            response = response.data;
            
            switch(response.status){
                case "pending":
                    data = true;
                    break;
                case "error":
                case "completed":
                    return response
                case "not_found":
                    data = false;
                    break;
            }
        }

        return handleStream({ data:response, name: this.name }, options?.stream || false, this.handleResponse.bind(this));
    }

    handleResponse(text:any) {
        text = text.substring(text.indexOf('{'), text.length);
        const obj = JSON.parse(text);
        if (!obj || !obj.gpt) throw new Error("Invalid response.");
        return obj.gpt;
    }
}

export default GPT;
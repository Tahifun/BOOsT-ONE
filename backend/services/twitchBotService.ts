import logger from '../utils/logger.js'
?// backend/services/twitchBotService.ts
// -> Aufger�umt: sichere Flow-Ladung, keine null-Zuweisungen, saubere Emojis, defensives Handling.

import QuantumFlow, { type IQuantumFlow } from "../models/QuantumFlow.js";

type TmiClient = any;

class TwitchBotService {
  private client: TmiClient | null = null;
  private currentChannel: string | null = null;

  private activeQuantumFlows: Map<string, IQuantumFlow> = new Map();
  private quantumTriggers: Map<string, string[]> = new Map();

  setClient(client: TmiClient, defaultChannel?: string) {
    this.client = client;
    if (defaultChannel) this.currentChannel = defaultChannel;
  }

  async activateQuantumFlow(quantumFlow: IQuantumFlow): Promise<void> {
    const id = String((quantumFlow as any)._id ?? (quantumFlow as any).id);
    this.activeQuantumFlows.set(id, quantumFlow);

    const triggerNodes = (quantumFlow as any).nodes?.filter((n: unknown) => n?.type === "neural_trigger") ?? [];
    for (const triggerNode of triggerNodes) {
      const trigger = (triggerNode as any)?.config?.trigger;
      if (!trigger) continue;
      if (!this.quantumTriggers.has(trigger)) this.quantumTriggers.set(trigger, []);
      this.quantumTriggers.get(trigger)!.push(id);
    }
  }

  async deactivateQuantumFlow(flowId: string): Promise<void> {
    for (const [trigger, flowIds] of this.quantumTriggers.entries()) {
      const idx = flowIds.indexOf(flowId);
      if (idx !== -1) {
        flowIds.splice(idx, 1);
        if (flowIds.length === 0) this.quantumTriggers.delete(trigger);
      }
    }
    this.activeQuantumFlows.delete(flowId);
  }

  async loadActiveQuantumFlows(): Promise<void> {
    const activeFlows = await QuantumFlow.find({ isActive: true }).exec();
    for (const flow of activeFlows) {
      await this.activateQuantumFlow(flow as unknown as IQuantumFlow);
    }
  }

  async execute(command: string, args: unknown) {
    if (command.startsWith("quantum_")) {
      return this.handleQuantumCommand(command, args);
    }

    const trigger = command.replace(/^quantum_flow_trigger_/, "");
    if (this.quantumTriggers.has(trigger)) {
      return this.executeQuantumTriggers(trigger, args);
    }

    switch (command) {
      case "auto_moderation_update": return this.updateAutoModeration(args);
      case "welcome_messages_update": return this.updateWelcomeMessages(args);
      case "timer_messages_update": return this.updateTimerMessages(args);
      case "auto_shoutout_update": return this.updateAutoShoutout(args);
      case "custom_command_add": return this.addCustomCommand(args);
      case "sound_add": return this.addSound(args);
      case "afk_detection_toggle": return this.toggleAFKDetection(args);
      case "poll_start": return this.startPoll(args);
      case "quantum_flow_execute": return this.executeQuantumFlowCommand(args);
      default:
        return { success: false, message: `Unknown command: ${command}` };
    }
  }

  private async handleQuantumCommand(command: string, args: unknown) {
    switch (command) {
      case "quantum_flow_execute": return this.executeQuantumFlowCommand(args);
      case "quantum_flow_activate": return this.activateQuantumFlowCommand(args);
      case "quantum_flow_deactivate": return this.deactivateQuantumFlowCommand(args);
      case "quantum_neural_sync": return this.executeNeuralSync(args);
      case "quantum_plasma_field": return this.activatePlasmaField(args);
      case "quantum_cosmic_action": return this.executeCosmicAction(args);
      case "quantum_ai_consciousness": return this.activateAIConsciousness(args);
      case "quantum_integration": return this.executeQuantumIntegration(args);
      case "quantum_holographic_display": return this.displayHologram(args);
      default:
        return { success: false, message: `Unknown quantum command: ${command}` };
    }
  }

  private async executeQuantumTriggers(trigger: string, context: unknown) {
    const flowIds = this.quantumTriggers.get(trigger) || [];
    const results: unknown[] = [];

    for (const flowId of flowIds) {
      const flow = this.activeQuantumFlows.get(flowId);
      if (!flow) continue;

      try {
        const result = await this.executeFlow(flow, {
          command: trigger,
          user: context?.user || context?.username || "unknown",
          channel: context?.channel || this.currentChannel || "#unknown",
          args: context?.args || [],
          timestamp: new Date().toISOString(),
        });

        results.push({ flowId, flowName: (flow as any).name, result });

        if (result?.success && Array.isArray(result.outputs)) {
          for (const output of result.outputs) {
            await this.handleQuantumOutput(output, context);
          }
        }
      } catch (err: unknown) {
        results.push({ flowId, flowName: (flow as any).name, result: { success: false, error: err?.message } });
      }
    }

    return { success: true, message: `Executed ${results.length} quantum flows for trigger: ${trigger}`, results };
  }

  private async handleQuantumOutput(output: unknown, context: unknown) {
    switch (output?.type) {
      case "neural_trigger":
      case "plasma_condition":
        return; // no-op
      case "cosmic_action":
        return this.handleCosmicActionOutput(output.output, context);
      case "ai_consciousness":
        return this.handleAIConsciousnessOutput(output.output, context);
      case "quantum_integration":
        return this.handleQuantumIntegrationOutput(output.output, context);
      case "holographic_display":
        return this.handleHolographicDisplayOutput(output.output, context);
      default:
        return;
    }
  }

  private async handleCosmicActionOutput(output: unknown, context: unknown) {
    if (output?.actionExecuted === "send_message" && output?.message) {
      const channel = context?.channel || this.currentChannel;
      if (channel && this.client?.say) {
        await this.client.say(channel, output.message);
      }
    }
  }

  private async handleAIConsciousnessOutput(output: unknown, context: unknown) {
    if (output?.aiResponse) {
      const channel = context?.channel || this.currentChannel;
      if (channel && this.client?.say) {
        await this.client.say(channel, `??  ${output.aiResponse}`);
      }
    }
  }

  private async handleQuantumIntegrationOutput(output: unknown, _context: unknown) {
    // Platzhalter - hier w�rdest du Integrationen (Webhooks, DB, etc.) anschlie�en
    logger.debug("Quantum integration executed:", output);
  }

  private async handleHolographicDisplayOutput(output: unknown, context: unknown) {
    const channel = context?.channel || this.currentChannel;
    if (channel && this.client?.say) {
      await this.client.say(channel, `?? Holographic display activated: ${output?.type ?? "unknown"}`);
    }
  }

  private async executeQuantumFlowCommand(args: unknown) {
    const { flowId, trigger } = args || {};
    if (!flowId) return { success: false, message: "flowId required" };

    let flow: IQuantumFlow | undefined = this.activeQuantumFlows.get(flowId);
    if (!flow) {
      const found = await QuantumFlow.findById(flowId).exec();
      if (found) flow = found as unknown as IQuantumFlow;
    }
    if (!flow) return { success: false, message: "Quantum flow not found" };

    const result = await this.executeFlow(flow, trigger ?? {});
    return { success: true, data: result };
  }

  private async activateQuantumFlowCommand(args: unknown) {
    const { flowId } = args || {};
    if (!flowId) return { success: false, message: "flowId required" };
    const flow = await QuantumFlow.findById(flowId).exec();
    if (!flow) return { success: false, message: "Quantum flow not found" };
    await this.activateQuantumFlow(flow as unknown as IQuantumFlow);
    return { success: true, message: "Quantum flow activated" };
  }

  private async deactivateQuantumFlowCommand(args: unknown) {
    const { flowId } = args || {};
    if (!flowId) return { success: false, message: "flowId required" };
    await this.deactivateQuantumFlow(flowId);
    return { success: true, message: "Quantum flow deactivated" };
  }

  private async executeNeuralSync(args: unknown) {
    const channel = args?.channel || this.currentChannel;
    if (channel && this.client?.say) {
      await this.client.say(channel, "?? ? Neural synchronization complete! Reality matrix updated! ?");
    }
    return { success: true, message: "Neural sync executed" };
  }

  private async activatePlasmaField(args: unknown) {
    const channel = args?.channel || this.currentChannel;
    if (channel && this.client?.say) {
      await this.client.say(channel, "??? Plasma field charged to maximum! Cosmic powers activated! ??");
    }
    return { success: true, message: "Plasma field activated" };
  }

  // �ffentliche Message-API (z. B. vom IRC-Client aufzurufen)
  public async handleMessage(channel: string, tags: unknown, message: string, self: boolean) {
    return this.onMessage(channel, tags, message, self);
  }

  protected async onMessage(channel: string, tags: unknown, message: string, self: boolean) {
    if (self) return;
    const username = tags?.username || tags?.["display-name"] || "unknown";
    const text = String(message || "").trim();

    if (text.startsWith("!")) {
      const parts = text.split(" ");
      const command = parts[0].substring(1);
      const args = parts.slice(1);

      if (this.quantumTriggers.has(command)) {
        await this.executeQuantumTriggers(command, { user: username, channel, args, tags, originalMessage: text });
        return;
      }
    }
  }

  getQuantumStatus() {
    return {
      activeFlows: this.activeQuantumFlows.size,
      registeredTriggers: this.quantumTriggers.size,
      triggers: Array.from(this.quantumTriggers.keys()),
      flows: Array.from(this.activeQuantumFlows.values()).map((flow: unknown) => ({
        id: String(flow._id),
        name: flow.name,
        nodeCount: (flow.nodes || []).length,
        connectionCount: (flow.connections || []).length,
        executionCount: flow.executionCount ?? 0,
      })),
    };
  }

  getStatus() {
    return { connected: !!this.client, channels: [], uptime: 0 };
  }

  // Platzhalter-Engine: hier w�rdest du die Nodes/Edges deines Flows ausf�hren
  private async executeFlow(flow: IQuantumFlow, ctx: unknown) {
    return {
      success: true,
      flowId: String((flow as any)._id),
      flowName: (flow as any).name,
      context: ctx,
      outputs: [
        {
          type: "cosmic_action",
          output: { actionExecuted: "send_message", message: `? Executed flow "${(flow as any).name}"` },
        },
      ],
    };
  }

  // Platzhalter f�r klassische Bot-Features
  private async updateAutoModeration(_args: unknown) { void _args; return { success: true, message: "Auto moderation updated" }; }
  private async updateWelcomeMessages(_args: unknown) { void _args; return { success: true, message: "Welcome messages updated" }; }
  private async updateTimerMessages(_args: unknown) { void _args; return { success: true, message: "Timer messages updated" }; }
  private async updateAutoShoutout(_args: unknown) { void _args; return { success: true, message: "Auto shoutout updated" }; }
  private async addCustomCommand(_args: unknown) { void _args; return { success: true, message: "Custom command added" }; }
  private async addSound(_args: unknown) { void _args; return { success: true, message: "Sound added" }; }
  private async toggleAFKDetection(_args: unknown) { void _args; return { success: true, message: "AFK detection toggled" }; }
  private async startPoll(_args: unknown) { void _args; return { success: true, message: "Poll started" }; }
  private async executeCosmicAction(_args: unknown) { void _args; return { success: true, message: "Cosmic action executed" }; }
  private async activateAIConsciousness(_args: unknown) { void _args; return { success: true, message: "AI consciousness activated" }; }
  private async executeQuantumIntegration(_args: unknown) { void _args; return { success: true, message: "Quantum integration executed" }; }
  private async displayHologram(_args: unknown) { void _args; return { success: true, message: "Hologram displayed" }; }
}

export const twitchBotService = new TwitchBotService();
export default twitchBotService;

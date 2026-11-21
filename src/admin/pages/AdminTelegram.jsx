import { useCallback, useEffect, useState } from "react";
import {
  adminTelegramChatAction,
  adminTelegramChatAdd,
  adminTelegramChatDetail,
  adminTelegramChats,
  adminTelegramControl,
} from "../adminApi";
import {
  Badge,
  Btn,
  Empty,
  ErrorBox,
  Modal,
  PageHeader,
  Panel,
  SkeletonRows,
} from "../ui";
import { inputCls } from "../formStyles";

const SITE_LABELS = {
  missing: "Saytda yo'q",
  blocked: "Bloklangan",
  teacher: "Ustoz",
  student: "O'quvchi",
};

export default function AdminTelegram({ isDark }) {
  const [control, setControl] = useState(null);
  const [chats, setChats] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newChat, setNewChat] = useState("");
  const [busy, setBusy] = useState("");

  const [membersOpen, setMembersOpen] = useState(false);
  const [membersChat, setMembersChat] = useState(null);
  const [members, setMembers] = useState([]);
  const [counts, setCounts] = useState(null);
  const [membersLoading, setMembersLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "active", site: "", q: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [controlData, chatsData] = await Promise.all([
        adminTelegramControl(),
        adminTelegramChats(),
      ]);
      setControl(controlData);
      setChats(chatsData.chats || []);
      setGroups(chatsData.groups || []);
    } catch (err) {
      setError(err.message || "Telegram ma'lumotlarini yuklab bo'lmadi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const muted = isDark ? "text-white/40" : "text-black/40";

  const controlAction = async (action) => {
    setBusy(action);
    setError("");
    setNotice("");
    try {
      const result = await adminTelegramControl({ action });
      setNotice(
        result.ok
          ? "Bajarildi."
          : result.description || result.detail || "Telegram xatosi."
      );
      await load();
    } catch (err) {
      setError(err.message || "Amal bajarilmadi.");
    } finally {
      setBusy("");
    }
  };

  const addChat = async (event) => {
    event.preventDefault();
    if (!newChat.trim()) return;
    setBusy("add");
    setError("");
    try {
      await adminTelegramChatAdd({ action: "add", chat: newChat.trim() });
      setNewChat("");
      setNotice("Guruh qo'shildi.");
      await load();
    } catch (err) {
      setError(err.message || "Guruhni qo'shib bo'lmadi.");
    } finally {
      setBusy("");
    }
  };

  const chatAction = async (chat, body, busyKey) => {
    setBusy(busyKey);
    setError("");
    setNotice("");
    try {
      const result = await adminTelegramChatAction(chat.id, body);
      if (result.stats) {
        setNotice(
          `Sinxron: ${result.stats.assigned} biriktirildi, ` +
            `${result.stats.moved} ko'chirildi, ` +
            `${result.stats.unassigned} chiqarildi.`
        );
      }
      await load();
      return result;
    } catch (err) {
      setError(err.message || "Amal bajarilmadi.");
      return null;
    } finally {
      setBusy("");
    }
  };

  const openMembers = async (chat, nextFilters = filters) => {
    setMembersOpen(true);
    setMembersChat(chat);
    setMembersLoading(true);
    setError("");
    try {
      const result = await adminTelegramChatDetail(chat.id, {
        status: nextFilters.status,
        site: nextFilters.site,
        q: nextFilters.q,
        limit: 100,
      });
      setMembers(result.members || []);
      setCounts(result.counts || null);
    } catch (err) {
      setError(err.message || "A'zolarni yuklab bo'lmadi.");
    } finally {
      setMembersLoading(false);
    }
  };

  const applyFilters = (patch) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    if (membersChat) openMembers(membersChat, next);
  };

  const memberAction = async (member, action) => {
    if (!membersChat) return;
    setBusy(`m-${member.id}`);
    try {
      await adminTelegramChatAction(membersChat.id, {
        action,
        member: member.id,
      });
      await openMembers(membersChat);
      await load();
    } catch (err) {
      setError(err.message || "Amal bajarilmadi.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Telegram"
        desc="Botni guruhga qo'shing, sayt guruhiga bog'lang va a'zolarni avtomatik biriktiring."
        actions={
          <Btn isDark={isDark} onClick={load} loading={loading}>
            Yangilash
          </Btn>
        }
      />

      <ErrorBox>{error}</ErrorBox>
      {notice && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-600 dark:text-emerald-400">
          {notice}
        </div>
      )}

      <Panel isDark={isDark} title="Webhook holati">
        {loading && !control ? (
          <SkeletonRows isDark={isDark} rows={3} cols={2} />
        ) : control ? (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              <Badge isDark={isDark} tone={control.token_configured ? "green" : "red"} dot>
                Bot token
              </Badge>
              <Badge isDark={isDark} tone={control.secret_configured ? "green" : "red"} dot>
                Webhook secret
              </Badge>
              <Badge isDark={isDark} tone={control.webapp_url_configured ? "green" : "amber"} dot>
                Mini App URL
              </Badge>
              <Badge isDark={isDark} tone={control.webhook_set ? "green" : "neutral"} dot>
                {control.webhook_set ? "Webhook o'rnatilgan" : "Webhook yo'q"}
              </Badge>
              <Badge isDark={isDark} tone="blue">
                {control.chats_count || 0} guruh
              </Badge>
            </div>

            {control.needs_webhook_reapply && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-600 dark:text-amber-400">
                Webhook eski yangilanishlar ro'yxati bilan o'rnatilgan. Qayta o'rnating —
                aks holda a'zolar qo'shilishi/chiqishi kelmaydi.
              </div>
            )}

            <div className={`text-xs ${muted}`}>
              Pending updates: {control.pending_update_count ?? 0}
              {control.last_error_message && (
                <span className="ml-2 text-red-500">{control.last_error_message}</span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn
                isDark={isDark}
                variant="primary"
                loading={busy === "set_webhook"}
                onClick={() => controlAction("set_webhook")}
              >
                Webhookni o'rnatish / yangilash
              </Btn>
              <Btn
                isDark={isDark}
                loading={busy === "set_commands"}
                onClick={() => controlAction("set_commands")}
              >
                Komandalarni o'rnatish
              </Btn>
              <Btn
                isDark={isDark}
                variant="danger"
                loading={busy === "delete_webhook"}
                onClick={() => controlAction("delete_webhook")}
              >
                Webhookni o'chirish
              </Btn>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel isDark={isDark} title="Sozlash" desc="Bot guruh a'zolarini qanday ko'radi">
        <ol className={`list-decimal space-y-1.5 px-8 py-4 text-xs leading-relaxed ${muted}`}>
          <li>Botni Telegram guruhga qo'shing va <b>administrator</b> qiling.</li>
          <li>@BotFather → Bot Settings → Group Privacy → <b>Turn off</b>.</li>
          <li>Guruhda <code className="font-mono">/register</code> yuboring — a'zolar shu orqali ro'yxatga tushadi.</li>
          <li>
            Telegram Bot API guruhning barcha a'zolarini ro'yxatlay olmaydi. Eski a'zolar
            faqat /register yoki guruhda yozganda ko'rinadi.
          </li>
          <li>A'zo saytda Telegram orqali kirgach, guruh avtomatik biriktiriladi.</li>
        </ol>
      </Panel>

      <Panel
        isDark={isDark}
        title="Guruhlar"
        desc="Bot a'zo bo'lgan Telegram guruhlar"
        actions={
          <form onSubmit={addChat} className="flex flex-wrap gap-2">
            <input
              value={newChat}
              onChange={(event) => setNewChat(event.target.value)}
              placeholder="@username yoki -100…"
              className={`${inputCls(isDark)} w-48 py-2 text-xs`}
            />
            <Btn isDark={isDark} variant="primary" type="submit" loading={busy === "add"}>
              Qo'shish
            </Btn>
          </form>
        }
      >
        {loading ? (
          <SkeletonRows isDark={isDark} rows={3} cols={3} />
        ) : chats.length === 0 ? (
          <Empty isDark={isDark}>
            Hozircha guruh yo'q. Botni guruhga qo'shing yoki @username bilan qo'shing.
          </Empty>
        ) : (
          <ul className={`divide-y ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
            {chats.map((chat) => (
              <li key={chat.id} className="flex flex-col gap-2 px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold">{chat.title || chat.chat_id}</span>
                  {chat.username && (
                    <span className={`text-[11px] ${muted}`}>@{chat.username}</span>
                  )}
                  <Badge isDark={isDark} tone={chat.is_active ? "green" : "neutral"} dot>
                    {chat.is_active ? "Bot a'zo" : "Bot yo'q"}
                  </Badge>
                  {chat.bot_status === "administrator" ? (
                    <Badge isDark={isDark} tone="accent">Admin</Badge>
                  ) : (
                    <Badge isDark={isDark} tone="amber">Admin emas</Badge>
                  )}
                  <Badge isDark={isDark} tone="blue">{chat.active_member_count} a'zo</Badge>
                  <Badge isDark={isDark} tone={chat.linked_member_count ? "green" : "neutral"}>
                    {chat.linked_member_count} saytda
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={chat.group_id || ""}
                    onChange={(event) =>
                      chatAction(
                        chat,
                        event.target.value
                          ? { action: "link", group_id: Number(event.target.value) }
                          : { action: "unlink" },
                        `link-${chat.id}`
                      )
                    }
                    className={`${inputCls(isDark)} w-auto min-w-[170px] py-1.5 text-xs`}
                    aria-label={`${chat.title} uchun sayt guruhi`}
                  >
                    <option value="">— Sayt guruhi yo'q —</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-[11px] font-semibold">
                    <input
                      type="checkbox"
                      checked={chat.auto_sync}
                      onChange={(event) =>
                        chatAction(
                          chat,
                          { action: "auto_sync", value: event.target.checked },
                          `auto-${chat.id}`
                        )
                      }
                      className="h-4 w-4 accent-[var(--accent)]"
                    />
                    Avto-biriktirish
                  </label>
                  <Btn isDark={isDark} onClick={() => openMembers(chat)}>A'zolar</Btn>
                  <Btn
                    isDark={isDark}
                    loading={busy === `sync-${chat.id}`}
                    onClick={() => chatAction(chat, { action: "sync" }, `sync-${chat.id}`)}
                  >
                    Sinxronlash
                  </Btn>
                  <Btn
                    isDark={isDark}
                    loading={busy === `refresh-${chat.id}`}
                    onClick={() => chatAction(chat, { action: "refresh" }, `refresh-${chat.id}`)}
                  >
                    Telegram'dan yangilash
                  </Btn>
                  <Btn
                    isDark={isDark}
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`«${chat.title}» ro'yxatdan o'chirilsinmi?`)) {
                        chatAction(chat, { action: "delete" }, `del-${chat.id}`);
                      }
                    }}
                  >
                    O'chirish
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        isDark={isDark}
        open={membersOpen}
        title={`A'zolar · ${membersChat?.title || ""}`}
        desc="Telegram guruhda bot ko'rgan a'zolar"
        size="lg"
        onClose={() => setMembersOpen(false)}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.status}
              onChange={(event) => applyFilters({ status: event.target.value })}
              className={`${inputCls(isDark)} w-auto py-2 text-xs`}
              aria-label="Holat"
            >
              <option value="active">Faol</option>
              <option value="left">Chiqgan</option>
              <option value="all">Barchasi</option>
            </select>
            <select
              value={filters.site}
              onChange={(event) => applyFilters({ site: event.target.value })}
              className={`${inputCls(isDark)} w-auto py-2 text-xs`}
              aria-label="Sayt holati"
            >
              <option value="">Saytda: barchasi</option>
              <option value="linked">Saytda bor</option>
              <option value="missing">Saytda yo'q</option>
            </select>
            <input
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilters({ q: event.target.value });
              }}
              placeholder="Ism / @username / id"
              className={`${inputCls(isDark)} w-52 py-2 text-xs`}
            />
            <Btn isDark={isDark} onClick={() => applyFilters({})}>Filtrlash</Btn>
            {counts && (
              <span className={`self-center text-[11px] ${muted}`}>
                {counts.active} faol · {counts.linked} saytda · {counts.missing} yo'q
              </span>
            )}
          </div>

          {membersLoading ? (
            <SkeletonRows isDark={isDark} rows={4} cols={3} />
          ) : members.length === 0 ? (
            <Empty isDark={isDark}>A'zolar topilmadi.</Empty>
          ) : (
            <ul className={`max-h-[55vh] divide-y overflow-y-auto ${isDark ? "divide-white/[0.07]" : "divide-black/[0.07]"}`}>
              {members.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold">{member.full_name}</span>
                      {member.username && (
                        <span className={`text-[10px] ${muted}`}>@{member.username}</span>
                      )}
                      <Badge
                        isDark={isDark}
                        tone={
                          member.site_status === "missing"
                            ? "amber"
                            : member.site_status === "blocked"
                              ? "red"
                              : "green"
                        }
                      >
                        {SITE_LABELS[member.site_status] || member.site_status}
                      </Badge>
                      {!member.is_active && (
                        <Badge isDark={isDark} tone="neutral">{member.status}</Badge>
                      )}
                    </div>
                    <div className={`mt-0.5 text-[10px] ${muted}`}>
                      {member.site_user?.email
                        ? `${member.site_user.email} · ${member.site_user.group_name || "guruhsiz"}`
                        : "Sayt hisobi yo'q — saytga Telegram orqali kirsin"}
                    </div>
                  </div>
                  {member.site_user && (
                    <div className="flex gap-1.5">
                      <Btn
                        isDark={isDark}
                        loading={busy === `m-${member.id}`}
                        onClick={() => memberAction(member, "assign")}
                      >
                        Biriktirish
                      </Btn>
                      <Btn
                        isDark={isDark}
                        variant="soft"
                        loading={busy === `m-${member.id}`}
                        onClick={() => memberAction(member, "unassign")}
                      >
                        Chiqarish
                      </Btn>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>
    </div>
  );
}

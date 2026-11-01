import { getUser, hasMockAccess, isRoundUpGroup } from '../utils/api';

export default function RequireGroup({ type, children }) {
  const user = getUser();
  const group = user?.group_detail;

  if (type === 'mock') {
    // External user (guruh yo'q) — ruxsat
    // IELTS guruh + mock_access — ruxsat
    // Round Up yoki mock_access yo'q — rad
    if (group && !hasMockAccess()) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl opacity-30">🔒</div>
          <h2 className="text-xl font-bold text-balance dark:text-white/80">
            Mock testlarga kirish yo'q
          </h2>
          <p className="max-w-sm text-sm text-black/50 dark:text-white/40">
            `"${group.name}" guruhingizda mock testlarga kirish ruxsati yo'q. O'qituvchingiz bilan bog'laning.`
          </p>
        </div>
      );
    }
  }

  if (type === 'grammar') {
    if (!isRoundUpGroup()) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="text-5xl opacity-30">🔒</div>
          <h2 className="text-xl font-bold text-balance dark:text-white/80">
            Grammatika faqat Round Up guruhlari uchun
          </h2>
          <p className="max-w-sm text-sm text-black/50 dark:text-white/40">
            {group
              ? `"${group.name}" — bu IELTS guruhi. Grammatika testlari faqat Round Up guruhlari uchun mavjud.`
              : "Siz hali biror guruhga qo'shilmagansiz. O'qituvchingiz bilan bog'laning."}
          </p>
        </div>
      );
    }
  }

  return children;
}

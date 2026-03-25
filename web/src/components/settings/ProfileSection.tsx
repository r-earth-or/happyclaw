import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  Bot,
  Link,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Palette,
  Sun,
  Trash2,
  Unlink,
  Upload,
  User,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { api } from '../../api/client';
import { useAuthStore } from '../../stores/auth';
import {
  useTheme,
  type ColorScheme,
  type FontStyle,
  type Theme,
} from '../../hooks/useTheme';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { EmojiAvatar } from '@/components/common/EmojiAvatar';
import { EmojiPicker } from '@/components/common/EmojiPicker';
import { ColorPicker } from '@/components/common/ColorPicker';
import { getErrorMessage } from './types';
import { SettingsCard as Section } from './SettingsCard';

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'system', label: '系统', icon: Monitor },
];

const SCHEME_OPTIONS: {
  value: ColorScheme;
  label: string;
  preview: { bg: string; accent: string; text: string };
}[] = [
  { value: 'default', label: '经典绿', preview: { bg: '#ffffff', accent: '#0d9488', text: '#0f172a' } },
  { value: 'orange', label: '暖橙', preview: { bg: '#faf9f5', accent: '#f97316', text: '#141413' } },
  { value: 'neutral', label: '素白', preview: { bg: '#ffffff', accent: '#52525b', text: '#18181b' } },
];

const FONT_OPTIONS: {
  value: FontStyle;
  label: string;
  sample: string;
  fontFamily: string;
}[] = [
  { value: 'default', label: 'HappyClaw', sample: 'Hello 你好', fontFamily: "'Inter Variable', system-ui, sans-serif" },
  { value: 'anthropic', label: 'Anthropic', sample: 'Hello 你好', fontFamily: "Georgia, 'Noto Serif SC', serif" },
];

function OptionButton({
  active,
  onClick,
  children,
  className = '',
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-xl border-2 transition-all ${
        active
          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
          : 'border-border hover:border-muted-foreground/30'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function validateAvatarFile(file: File): string | null {
  if (file.size > MAX_AVATAR_SIZE) {
    return '图片文件不能超过 3MB';
  }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return '仅支持 jpg、png、gif、webp 格式';
  }
  return null;
}

export function ProfileSection() {
  const {
    user: currentUser,
    changePassword,
    updateProfile,
    uploadAvatar,
    unbindFeishu,
  } = useAuthStore();
  const { theme, setTheme, colorScheme, setColorScheme, fontStyle, setFontStyle } =
    useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [userAvatarUploading, setUserAvatarUploading] = useState(false);
  const userAvatarInputRef = useRef<HTMLInputElement>(null);

  const [aiName, setAiName] = useState('');
  const [aiAvatarEmoji, setAiAvatarEmoji] = useState<string | null>(null);
  const [aiAvatarColor, setAiAvatarColor] = useState<string | null>(null);
  const [aiAvatarUrl, setAiAvatarUrl] = useState<string | null>(null);
  const [aiAppearanceSaving, setAiAppearanceSaving] = useState(false);
  const [aiAvatarUploading, setAiAvatarUploading] = useState(false);
  const aiAvatarInputRef = useRef<HTMLInputElement>(null);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [pwdChanging, setPwdChanging] = useState(false);

  const [feishuBinding, setFeishuBinding] = useState(false);
  const [feishuUnbinding, setFeishuUnbinding] = useState(false);
  const [feishuError, setFeishuError] = useState<string | null>(null);

  useEffect(() => {
    setUsername(currentUser?.username || '');
    setDisplayName(currentUser?.display_name || '');
    setAvatarEmoji(currentUser?.avatar_emoji ?? null);
    setAvatarColor(currentUser?.avatar_color ?? null);
    setAvatarUrl(currentUser?.avatar_url ?? null);
    setAiName(currentUser?.ai_name || '');
    setAiAvatarEmoji(currentUser?.ai_avatar_emoji ?? null);
    setAiAvatarColor(currentUser?.ai_avatar_color ?? null);
    setAiAvatarUrl(currentUser?.ai_avatar_url ?? null);
  }, [
    currentUser?.username,
    currentUser?.display_name,
    currentUser?.avatar_emoji,
    currentUser?.avatar_color,
    currentUser?.avatar_url,
    currentUser?.ai_name,
    currentUser?.ai_avatar_emoji,
    currentUser?.ai_avatar_color,
    currentUser?.ai_avatar_url,
  ]);

  useEffect(() => {
    const bindResult = searchParams.get('feishu_bind');
    if (!bindResult) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('feishu_bind');
        return next;
      },
      { replace: true },
    );

    if (bindResult === 'success') {
      setFeishuError(null);
      toast.success('飞书账号绑定成功');
      return;
    }

    if (bindResult === 'conflict') {
      const message = '该飞书账号已绑定其他用户';
      setFeishuError(message);
      toast.error(message);
    }
  }, [searchParams, setSearchParams]);

  const handleUpdateProfile = async () => {
    setProfileSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        display_name: displayName.trim(),
        avatar_emoji: avatarEmoji,
        avatar_color: avatarColor,
      });
      toast.success('基础信息已更新');
    } catch (err) {
      toast.error(getErrorMessage(err, '更新基础信息失败'));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUserAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    const error = validateAvatarFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setUserAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, 'user');
      setAvatarUrl(url);
      toast.success('头像已上传');
    } catch (err) {
      toast.error(getErrorMessage(err, '上传头像失败'));
    } finally {
      setUserAvatarUploading(false);
    }
  };

  const handleRemoveUserAvatar = async () => {
    try {
      await updateProfile({ avatar_url: null });
      setAvatarUrl(null);
      toast.success('头像已移除');
    } catch (err) {
      toast.error(getErrorMessage(err, '移除头像失败'));
    }
  };

  const handleBindFeishu = async () => {
    setFeishuBinding(true);
    setFeishuError(null);
    try {
      const data = await api.get<{ authorizeUrl: string }>(
        '/api/auth/feishu/bind-authorize',
      );
      window.location.href = data.authorizeUrl;
    } catch (err) {
      const message = getErrorMessage(err, '获取飞书授权链接失败');
      setFeishuError(message);
      toast.error(message);
      setFeishuBinding(false);
    }
  };

  const handleUnbindFeishu = async () => {
    setFeishuUnbinding(true);
    setFeishuError(null);
    try {
      await unbindFeishu();
      toast.success('飞书账号已解绑');
    } catch (err) {
      const message = getErrorMessage(err, '解绑飞书账号失败');
      setFeishuError(message);
      toast.error(message);
    } finally {
      setFeishuUnbinding(false);
    }
  };

  const handleSaveAiAppearance = async () => {
    setAiAppearanceSaving(true);
    try {
      await updateProfile({
        ai_name: aiName.trim() || null,
        ai_avatar_emoji: aiAvatarEmoji,
        ai_avatar_color: aiAvatarColor,
      });
      toast.success('机器人外观已更新');
    } catch (err) {
      toast.error(getErrorMessage(err, '更新机器人外观失败'));
    } finally {
      setAiAppearanceSaving(false);
    }
  };

  const handleAiAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    const error = validateAvatarFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    setAiAvatarUploading(true);
    try {
      const url = await uploadAvatar(file, 'ai');
      setAiAvatarUrl(url);
      toast.success('头像已上传');
    } catch (err) {
      toast.error(getErrorMessage(err, '上传头像失败'));
    } finally {
      setAiAvatarUploading(false);
    }
  };

  const handleRemoveAiAvatar = async () => {
    try {
      await updateProfile({ ai_avatar_url: null });
      setAiAvatarUrl(null);
      toast.success('头像已移除');
    } catch (err) {
      toast.error(getErrorMessage(err, '移除头像失败'));
    }
  };

  const handleChangePassword = async () => {
    setPwdChanging(true);
    try {
      await changePassword(currentUser?.has_password ? currentPwd : null, newPwd);
      setCurrentPwd('');
      setNewPwd('');
      toast.success(currentUser?.has_password ? '密码已修改' : '密码已设置');
    } catch (err) {
      toast.error(getErrorMessage(err, '修改密码失败'));
    } finally {
      setPwdChanging(false);
    }
  };

  return (
    <div className="space-y-4">
      <Section icon={Palette} title="主题与外观" desc="个人界面偏好，仅影响你自己">
        <div>
          <Label className="mb-2 text-xs text-muted-foreground">配色方案</Label>
          <div className="grid grid-cols-3 gap-2">
            {SCHEME_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                active={colorScheme === option.value}
                onClick={() => setColorScheme(option.value)}
                className="flex flex-col gap-2 p-2.5"
              >
                <div
                  className="flex h-10 w-full items-end gap-1 rounded-lg border border-black/5 p-1.5"
                  style={{ background: option.preview.bg }}
                >
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ background: option.preview.accent }}
                  />
                  <div className="flex-1 space-y-0.5">
                    <div
                      className="h-1 w-3/4 rounded-full"
                      style={{ background: option.preview.text, opacity: 0.6 }}
                    />
                    <div
                      className="h-1 w-1/2 rounded-full"
                      style={{ background: option.preview.text, opacity: 0.25 }}
                    />
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    colorScheme === option.value ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {option.label}
                </span>
              </OptionButton>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 text-xs text-muted-foreground">明暗模式</Label>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <OptionButton
                  key={option.value}
                  active={theme === option.value}
                  onClick={() => setTheme(option.value)}
                  className="flex flex-col items-center gap-1 px-2 py-2.5"
                >
                  <Icon
                    className={`h-4 w-4 ${
                      theme === option.value ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      theme === option.value ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </span>
                </OptionButton>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="mb-2 text-xs text-muted-foreground">字体风格</Label>
          <div className="grid grid-cols-2 gap-2">
            {FONT_OPTIONS.map((option) => (
              <OptionButton
                key={option.value}
                active={fontStyle === option.value}
                onClick={() => setFontStyle(option.value)}
                className="flex flex-col gap-1.5 p-2.5"
              >
                <span
                  className="truncate text-sm leading-snug text-foreground"
                  style={{ fontFamily: option.fontFamily }}
                >
                  {option.sample}
                </span>
                <span
                  className={`text-xs font-medium ${
                    fontStyle === option.value ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {option.label}
                </span>
              </OptionButton>
            ))}
          </div>
        </div>
      </Section>

      <Section icon={User} title="账户信息">
        <div className="flex items-center gap-4">
          <EmojiAvatar
            imageUrl={avatarUrl}
            emoji={avatarEmoji}
            color={avatarColor}
            fallbackChar={displayName || username}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">
              {displayName || username || '未设置'}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {currentUser?.role === 'admin' ? '管理员' : '普通成员'} ·{' '}
              {currentUser?.status === 'active' ? '已启用' : '已禁用'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1 text-xs text-muted-foreground">用户名</Label>
            <Input value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div>
            <Label className="mb-1 text-xs text-muted-foreground">显示名称</Label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">头像</Label>
          <div>
            <Label className="mb-1.5 text-[11px] text-muted-foreground">上传图片</Label>
            <input
              ref={userAvatarInputRef}
              type="file"
              accept={ALLOWED_AVATAR_TYPES.join(',')}
              className="hidden"
              onChange={handleUserAvatarUpload}
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={userAvatarUploading}
                onClick={() => userAvatarInputRef.current?.click()}
              >
                {userAvatarUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                上传头像
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveUserAvatar}
                >
                  <Trash2 className="size-3.5" />
                  移除
                </Button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              jpg/png/gif/webp，最大 3MB。上传后优先于 Emoji 显示
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 text-[11px] text-muted-foreground">Emoji</Label>
              <EmojiPicker value={avatarEmoji ?? undefined} onChange={setAvatarEmoji} />
            </div>
            <div>
              <Label className="mb-1.5 text-[11px] text-muted-foreground">背景色</Label>
              <ColorPicker value={avatarColor ?? undefined} onChange={setAvatarColor} />
            </div>
          </div>
        </div>

        <Button onClick={handleUpdateProfile} disabled={profileSaving || !username.trim()} size="sm">
          {profileSaving && <Loader2 className="size-4 animate-spin" />}
          保存
        </Button>
      </Section>

      <Section
        icon={Link}
        title="飞书账号"
        desc="绑定后可使用共享飞书机器人自动路由到你的工作区，也可使用飞书扫码登录"
      >
        {currentUser?.feishu_open_id ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                <Link className="size-4 shrink-0" />
                <span>已绑定飞书账号</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={feishuUnbinding}
                onClick={handleUnbindFeishu}
              >
                {feishuUnbinding ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Unlink className="size-4" />
                )}
                解绑
              </Button>
            </div>
            {!currentUser.has_password && (
              <p className="text-xs text-muted-foreground">
                当前账号通过飞书创建，需先设置本地密码后才能解绑。
              </p>
            )}
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={feishuBinding}
              onClick={handleBindFeishu}
            >
              {feishuBinding ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link className="size-4" />
              )}
              绑定飞书账号
            </Button>
            <p className="text-xs text-muted-foreground">
              绑定后可以被共享飞书机器人按发送者身份识别，也可直接飞书扫码登录。
            </p>
          </>
        )}

        {feishuError && <p className="text-xs text-destructive">{feishuError}</p>}
      </Section>

      <Section
        icon={Bot}
        title="我的机器人"
        desc="自定义 AI 助手外观，仅影响你看到的对话界面"
      >
        <div className="flex items-center gap-4">
          <EmojiAvatar
            imageUrl={aiAvatarUrl}
            emoji={aiAvatarEmoji}
            color={aiAvatarColor}
            fallbackChar={aiName || 'AI'}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground">
              {aiName || '使用系统默认'}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">个人 AI 外观覆盖</div>
          </div>
        </div>

        <div>
          <Label className="mb-1 text-xs text-muted-foreground">AI 名称</Label>
          <Input
            value={aiName}
            onChange={(event) => setAiName(event.target.value)}
            placeholder="留空使用系统默认"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 text-[11px] text-muted-foreground">Emoji</Label>
            <EmojiPicker value={aiAvatarEmoji ?? undefined} onChange={setAiAvatarEmoji} />
          </div>
          <div>
            <Label className="mb-1.5 text-[11px] text-muted-foreground">背景色</Label>
            <ColorPicker value={aiAvatarColor ?? undefined} onChange={setAiAvatarColor} />
          </div>
        </div>

        <div>
          <Label className="mb-1 text-xs text-muted-foreground">自定义头像图片</Label>
          <input
            ref={aiAvatarInputRef}
            type="file"
            accept={ALLOWED_AVATAR_TYPES.join(',')}
            className="hidden"
            onChange={handleAiAvatarUpload}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={aiAvatarUploading}
              onClick={() => aiAvatarInputRef.current?.click()}
            >
              {aiAvatarUploading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Upload className="size-3.5" />
              )}
              上传图片
            </Button>
            {aiAvatarUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemoveAiAvatar}
              >
                <Trash2 className="size-3.5" />
                移除
              </Button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">jpg/png/gif/webp，最大 3MB</p>
        </div>

        <Button onClick={handleSaveAiAppearance} disabled={aiAppearanceSaving} size="sm">
          {aiAppearanceSaving && <Loader2 className="size-4 animate-spin" />}
          保存
        </Button>
      </Section>

      <Section
        icon={Lock}
        title={currentUser?.has_password ? '修改密码' : '设置密码'}
        desc={
          currentUser?.has_password
            ? '修改当前登录密码'
            : '当前账号来自飞书登录，先设置本地密码后可独立登录或解绑飞书'
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {currentUser?.has_password && (
            <div>
              <Label className="mb-1 text-xs text-muted-foreground">当前密码</Label>
              <Input
                type="password"
                value={currentPwd}
                onChange={(event) => setCurrentPwd(event.target.value)}
              />
            </div>
          )}
          <div>
            <Label className="mb-1 text-xs text-muted-foreground">新密码</Label>
            <Input
              type="password"
              value={newPwd}
              onChange={(event) => setNewPwd(event.target.value)}
              placeholder="至少 8 位"
            />
          </div>
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={pwdChanging || !newPwd || (currentUser?.has_password ? !currentPwd : false)}
          size="sm"
        >
          {pwdChanging && <Loader2 className="size-4 animate-spin" />}
          {currentUser?.has_password ? '修改密码' : '设置密码'}
        </Button>
      </Section>
    </div>
  );
}

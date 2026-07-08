import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LucideIcon } from "@/components/ui/icon-lucide";
import { useColors } from "@/hooks/use-colors";
import { useAuthStore } from "@/lib/auth-store";
import { trpc } from "@/lib/trpc";

const MAX_GALLERY_IMAGES = 10;

export default function EditCompanyProfileScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: profile, isLoading: isLoadingProfile } = trpc.company.myProfile.useQuery();
  const { data: companyDetail } = trpc.companies.detail.useQuery(
    { id: user?.id ?? 0 },
    { enabled: !!user?.id }
  );

  const [companyName, setCompanyName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyDesc, setCompanyDesc] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setCompanyName(profile.companyName ?? "");
      setRepresentativeName(profile.representativeName ?? "");
      setCompanyPhone(profile.companyPhone ?? "");
      setCompanyAddress(profile.companyAddress ?? "");
      setCompanyDesc(profile.companyDesc ?? "");
      setCompanyLogoUrl(profile.companyLogoUrl ?? null);
      setInitialized(true);
    }
  }, [profile, initialized]);

  useEffect(() => {
    if (companyDetail && (companyDetail as any).images) {
      setGalleryImages((companyDetail as any).images.map((img: any) => img.imageUrl));
    }
  }, [companyDetail]);

  const uploadLogoMutation = trpc.upload.companyLogo.useMutation();
  const updateMutation = trpc.company.updateProfile.useMutation({
    onSuccess: () => {
      Alert.alert("저장 완료", "업체 정보가 업데이트되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    },
    onError: (err) => Alert.alert("저장 실패", err.message),
  });

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], allowsEditing: true, aspect: [4, 3], quality: 0.8, base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64) return;
    setIsUploadingLogo(true);
    try {
      const uploaded = await uploadLogoMutation.mutateAsync({
        base64: result.assets[0].base64,
        mimeType: result.assets[0].mimeType ?? "image/jpeg",
        fileName: result.assets[0].fileName ?? "logo.jpg",
      });
      setCompanyLogoUrl(uploaded.url);
    } catch (err: any) {
      Alert.alert("업로드 실패", err?.message ?? "사진 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handlePickGalleryImages = async () => {
    if (galleryImages.length >= MAX_GALLERY_IMAGES) {
      Alert.alert("업로드 제한", `소개 사진은 최대 ${MAX_GALLERY_IMAGES}장까지 등록할 수 있어요.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("권한 필요", "사진 접근 권한이 필요합니다.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true,
      selectionLimit: MAX_GALLERY_IMAGES - galleryImages.length, base64: true,
    });
    if (result.canceled || result.assets.length === 0) return;
    setIsUploadingGallery(true);
    try {
      const uploaded: string[] = [];
      for (const asset of result.assets) {
        if (!asset.base64) continue;
        try {
          const res = await uploadLogoMutation.mutateAsync({
            base64: asset.base64,
            mimeType: asset.mimeType ?? "image/jpeg",
            fileName: asset.fileName ?? "photo.jpg",
          });
          uploaded.push(res.url);
        } catch {
          // 개별 실패는 건너뜀
        }
      }
      setGalleryImages((prev) => [...prev, ...uploaded].slice(0, MAX_GALLERY_IMAGES));
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!companyName.trim() || !representativeName.trim() || !companyPhone.trim() || !companyAddress.trim()) {
      Alert.alert("입력 오류", "업체명, 대표자명, 연락처, 주소는 필수입니다.");
      return;
    }
    updateMutation.mutate({
      companyName: companyName.trim(),
      representativeName: representativeName.trim(),
      companyPhone: companyPhone.trim(),
      companyAddress: companyAddress.trim(),
      companyDesc: companyDesc.trim() || undefined,
      companyLogoUrl: companyLogoUrl ?? undefined,
      images: galleryImages,
    });
  };

  if (isLoadingProfile) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Pressable style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, marginRight: 12 }]} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "600", color: colors.foreground }}>업체 정보 수정</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>업체 대표 사진</Text>
        <Pressable
          onPress={handlePickLogo}
          disabled={isUploadingLogo}
          style={{
            width: "100%", height: 160, borderRadius: 12, backgroundColor: colors.surface,
            borderWidth: 1.5, borderColor: companyLogoUrl ? colors.primary : colors.border,
            borderStyle: companyLogoUrl ? "solid" : "dashed",
            justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 20,
          }}
        >
          {isUploadingLogo ? (
            <ActivityIndicator color={colors.primary} />
          ) : companyLogoUrl ? (
            <Image source={{ uri: companyLogoUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <>
              <LucideIcon name="camera" size={26} color={colors.muted} strokeWidth={1.5} />
              <Text style={{ fontSize: 13, color: colors.muted, marginTop: 8 }}>업체 사진 또는 로고 등록</Text>
            </>
          )}
        </Pressable>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>소개 사진</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {galleryImages.map((uri, index) => (
              <View key={uri + index} style={{ width: 74, height: 74 }}>
                <Image source={{ uri }} style={{ width: 74, height: 74, borderRadius: 8, backgroundColor: colors.surface }} />
                <Pressable
                  onPress={() => handleRemoveGalleryImage(index)}
                  hitSlop={8}
                  style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#00000099", justifyContent: "center", alignItems: "center" }}
                >
                  <LucideIcon name="x" size={11} color="#fff" />
                </Pressable>
              </View>
            ))}
            {galleryImages.length < MAX_GALLERY_IMAGES && (
              <Pressable
                onPress={handlePickGalleryImages}
                disabled={isUploadingGallery}
                style={{ width: 74, height: 74, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center" }}
              >
                {isUploadingGallery ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <LucideIcon name="plus" size={18} color={colors.muted} strokeWidth={1.5} />
                    <Text style={{ fontSize: 9, color: colors.muted, marginTop: 3 }}>추가</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </ScrollView>

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>업체명 *</Text>
        <TextInput value={companyName} onChangeText={setCompanyName} placeholderTextColor={colors.muted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground, backgroundColor: colors.surface, fontSize: 14, marginBottom: 16 }} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>대표자명 *</Text>
        <TextInput value={representativeName} onChangeText={setRepresentativeName} placeholderTextColor={colors.muted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground, backgroundColor: colors.surface, fontSize: 14, marginBottom: 16 }} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>연락처 *</Text>
        <TextInput value={companyPhone} onChangeText={setCompanyPhone} keyboardType="phone-pad" placeholderTextColor={colors.muted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground, backgroundColor: colors.surface, fontSize: 14, marginBottom: 16 }} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>사업장 주소 *</Text>
        <TextInput value={companyAddress} onChangeText={setCompanyAddress} placeholderTextColor={colors.muted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.foreground, backgroundColor: colors.surface, fontSize: 14, marginBottom: 16 }} />

        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>업체 소개</Text>
        <TextInput
          value={companyDesc} onChangeText={setCompanyDesc} multiline numberOfLines={5} placeholderTextColor={colors.muted}
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, minHeight: 100, textAlignVertical: "top", color: colors.foreground, backgroundColor: colors.surface, fontSize: 14, marginBottom: 24 }}
        />

        <Pressable
          onPress={handleSave}
          disabled={updateMutation.isPending}
          style={({ pressed }) => [{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", opacity: pressed || updateMutation.isPending ? 0.85 : 1 }]}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#222222" />
          ) : (
            <Text style={{ color: "#222222", fontWeight: "700", fontSize: 15 }}>저장하기</Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

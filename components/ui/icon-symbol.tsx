import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  "house.fill": "home",
  "square.grid.2x2.fill": "apps",
  "plus.circle.fill": "add-circle",
  "bubble.left.fill": "chat-bubble",
  "person.fill": "person",
  "magnifyingglass": "search",
  "bell.fill": "notifications",
  "heart.fill": "favorite",
  "heart": "favorite-border",
  "phone.fill": "phone",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "star.fill": "star",
  "camera.fill": "camera-alt",
  "photo.fill": "photo",
  "mappin": "location-on",
  "xmark": "close",
  "ellipsis": "more-horiz",
  "flag.fill": "flag",
  "share": "share",
  "clock.fill": "access-time",
  "eye.fill": "visibility",
  "pencil": "edit",
  "trash.fill": "delete",
  "checkmark.circle.fill": "check-circle",
  "exclamationmark.triangle.fill": "warning",
  "arrow.left": "arrow-back",
  "gear": "settings",
  "questionmark.circle.fill": "help",
  "doc.text": "description",
  "list.bullet": "list",
  "tag.fill": "local-offer",
  "building.2.fill": "business",
  "storefront.fill": "storefront",
  "location.fill": "location-on",
  "shippingbox.fill": "inventory",
  "number": "tag",
  "plus": "add",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name as string] || "help-outline";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}

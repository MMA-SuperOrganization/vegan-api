import { SAVED_TARGET_TYPES as SAVED_TARGET_TYPES_ENUM } from "../../common/constants/enums/engagement.enums.js";

export const SAVED_TARGET_TYPES = SAVED_TARGET_TYPES_ENUM.values();

export const hasSaveCounter = (targetType) => targetType !== SAVED_TARGET_TYPES_ENUM.FOOD_ITEM;

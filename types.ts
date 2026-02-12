
export type InvitationCategory = 
  | 'Wedding' 
  | 'Ring Ceremony' 
  | 'Birthday' 
  | 'Pooja' 
  | 'Bhandara' 
  | 'Anniversary' 
  | 'Baby Shower' 
  | 'Housewarming' 
  | 'Engagement' 
  | 'Festival';

export interface Template {
  id: string;
  name: string;
  category: InvitationCategory;
  previewImage: string;
  style: string; 
  fields: string[];
  fontFamily?: string;
  textColor?: string;
}

export interface InvitationData {
  [key: string]: string;
}

export interface Invitation {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  templateId: string;
  templateData: InvitationData;
  status: 'sent' | 'viewed';
  timestamp: any;
  category: InvitationCategory;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  bio?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  whatsapp?: string;
  website?: string;
  friends: string[];
}

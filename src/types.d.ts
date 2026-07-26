type Project = {
  id: string;
  title: string;
  description: string;
  role: string;
  outcome?: string;
  stack: string[];
  keywords: string[];
  image: string;
  gallery?: string[];
  chromeUrl?: string;
  liveUrl?: string;
  repositoryUrl?: string;
  featured?: boolean;
  status: "public-demo" | "personal" | "concept" | "client";
  challenge?: string;
  solution?: string;
};


export interface MovieData {
  title: string;
  year: string;
  rating?: string;
  runtime: number;
  stars: number;
}

export interface Movie extends MovieData {
  poster: string;
}

import env from "./env";

import type { MovieData } from "./types";

export async function getMovie({ title, year }: MovieData) {
  const data = await fetch(
    "https://api.themoviedb.org/3/search/movie?" +
      new URLSearchParams({
        query: title,
        year,
      }).toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${env.TMDB_API_READ_ACCESS_TOKEN}`,
      },
    }
  ).then(
    (r) =>
      r.json() as Promise<{
        page: number;
        results: {
          adult: boolean;
          backdrop_path: string;
          genre_ids: number[];
          id: number;
          original_language: string;
          original_title: string;
          overview: string;
          popularity: number;
          poster_path: string;
          release_date: string;
          title: string;
          video: boolean;
          vote_average: number;
          vote_count: number;
        }[];
        total_pages: number;
        total_results: number;
      }>
  );

  return data.results[0];
}

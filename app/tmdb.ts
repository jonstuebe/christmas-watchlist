import axios from "axios";

import env from "./env";

import type { MovieData } from "./types";

const api = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Accept: "application/json",
    Authorization: `Bearer ${env.TMDB_API_READ_ACCESS_TOKEN}`,
  },
});

export async function getMovie({ title, year }: MovieData) {
  const { results } = await api
    .get<{
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
    }>("/search/movie", {
      params: {
        query: title,
        year,
      },
    })
    .then((r) => r.data);

  return results[0];
}
